#!/usr/bin/env bun
import { $ } from "bun";

type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: E; readonly ok: false };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ error, ok: false });

const dependency_fields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "overrides",
  "peerDependencies",
  "resolutions",
] as const;
const min_release_age_days = 7;
const registry = "https://registry.npmjs.org/";

//

const is_record = (x: unknown): x is Readonly<Record<string, unknown>> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const optional_string = (x: unknown) => (typeof x === "string" ? x : undefined);

const parse_json = (text: string): Result<unknown, { readonly kind: "invalid_json" }> => {
  try {
    return ok(JSON.parse(text));
  } catch {
    return err({ kind: "invalid_json" } as const);
  }
};

const dependency_names = (entry: Readonly<Record<string, unknown>>) =>
  dependency_fields.flatMap((field) => {
    const deps = entry[field];
    return is_record(deps) ? Object.keys(deps) : [];
  });

const parse_entry = ({ entry, path }: { entry: Readonly<Record<string, unknown>>; path: string }) => {
  const marker = path.lastIndexOf("node_modules/");
  return {
    dependencies: dependency_names(entry),
    has_install_script: entry.hasInstallScript === true,
    installed: marker >= 0 && entry.link !== true,
    integrity: optional_string(entry.integrity),
    name: optional_string(entry.name) ?? (marker >= 0 ? path.slice(marker + "node_modules/".length) : path),
    path,
    resolved: optional_string(entry.resolved),
    version: optional_string(entry.version),
  };
};

type LockEntry = ReturnType<typeof parse_entry>;

const parse_lock = (text: string) => {
  const json = parse_json(text);
  if (!json.ok) return json;
  if (!is_record(json.value) || !is_record(json.value.packages)) return err({ kind: "lockfile_without_packages" } as const);
  const lockfile_version = typeof json.value.lockfileVersion === "number" ? json.value.lockfileVersion : 0;
  if (lockfile_version < 2) return err({ kind: "lockfile_version_unsupported", lockfile_version } as const);
  return ok(
    Object.entries(json.value.packages).flatMap(([path, entry]) => (is_record(entry) ? [parse_entry({ entry, path })] : [])),
  );
};

//

const package_id = (entry: LockEntry) => `${entry.name}@${entry.version ?? "unknown"}`;

const changed_entries = ({ base, head }: { base: readonly LockEntry[]; head: readonly LockEntry[] }) => {
  const base_by_path = new Map(base.map((entry) => [entry.path, entry]));
  return head.filter((entry) => {
    const before = base_by_path.get(entry.path);
    return (
      before === undefined ||
      before.integrity !== entry.integrity ||
      before.resolved !== entry.resolved ||
      before.version !== entry.version
    );
  });
};

const lock_flags = ({ base, changed }: { base: readonly LockEntry[]; changed: readonly LockEntry[] }) => {
  const base_integrity = new Map(base.filter((entry) => entry.installed).map((entry) => [package_id(entry), entry.integrity]));
  const base_names = new Set(base.map((entry) => entry.name));
  const base_script_names = new Set(base.filter((entry) => entry.has_install_script).map((entry) => entry.name));
  const explained_names = new Set(changed.flatMap((entry) => entry.dependencies));
  return changed
    .filter((entry) => entry.installed)
    .flatMap((entry) => [
      ...(entry.resolved !== undefined && !entry.resolved.startsWith(registry)
        ? [{ kind: "foreign_source", package: package_id(entry), resolved: entry.resolved } as const]
        : []),
      ...(entry.has_install_script && !base_script_names.has(entry.name)
        ? [{ kind: "install_script_added", package: package_id(entry) } as const]
        : []),
      ...(base_integrity.has(package_id(entry)) && base_integrity.get(package_id(entry)) !== entry.integrity
        ? [{ kind: "integrity_changed", package: package_id(entry) } as const]
        : []),
      ...(!base_names.has(entry.name) && !explained_names.has(entry.name)
        ? [{ kind: "unexplained_package", package: package_id(entry) } as const]
        : []),
    ]);
};

type ReleaseFlag =
  | { readonly age_days: number; readonly kind: "fresh_release"; readonly package: string; readonly published_at: string }
  | { readonly kind: "publish_time_unknown"; readonly package: string };

const release_flags = ({
  now,
  packages,
  publish_times,
}: {
  now: Date;
  packages: readonly LockEntry[];
  publish_times: ReadonlyMap<string, string>;
}) =>
  packages.flatMap((entry): readonly ReleaseFlag[] => {
    const published_at = publish_times.get(package_id(entry));
    const published_ms = published_at === undefined ? Number.NaN : Date.parse(published_at);
    if (published_at === undefined || Number.isNaN(published_ms))
      return [{ kind: "publish_time_unknown", package: package_id(entry) }];
    const age_days = Math.floor((now.getTime() - published_ms) / 86_400_000);
    return age_days < min_release_age_days
      ? [{ age_days, kind: "fresh_release", package: package_id(entry), published_at }]
      : [];
  });

const without_dependency_fields = (manifest: unknown) =>
  is_record(manifest)
    ? Object.fromEntries(Object.entries(manifest).filter(([key]) => !dependency_fields.some((field) => field === key)))
    : manifest;

const file_flags = ({
  changed_files,
  manifests,
}: {
  changed_files: readonly string[];
  manifests: readonly { readonly after: unknown; readonly before: unknown; readonly file: string }[];
}) => [
  ...changed_files
    .filter((file) => file !== "package-lock.json" && !/(^|\/)package\.json$/.test(file))
    .map((file) => ({ file, kind: "file_outside_manifests" }) as const),
  ...manifests
    .filter(
      ({ after, before }) =>
        before === undefined ||
        after === undefined ||
        !Bun.deepEquals(without_dependency_fields(before), without_dependency_fields(after)),
    )
    .map(({ file }) => ({ file, kind: "manifest_non_dependency_change" }) as const),
];

//

const git_show = async ({ file, ref }: { file: string; ref: string }) => {
  const shown = await $`git show ${ref}:${file}`.quiet().nothrow();
  return shown.exitCode === 0 ? shown.text() : undefined;
};

const fetch_publish_times = async (packages: readonly LockEntry[]) => {
  const names = [...new Set(packages.map((entry) => entry.name))];
  const times_by_name = new Map<string, Readonly<Record<string, unknown>>>();
  for (let start = 0; start < names.length; start += 8) {
    await Promise.all(
      names.slice(start, start + 8).map(async (name) => {
        const viewed = await $`npm view ${name} time --json`.quiet().nothrow();
        const times = viewed.exitCode === 0 ? parse_json(viewed.text()) : undefined;
        if (times?.ok && is_record(times.value)) times_by_name.set(name, times.value);
      }),
    );
  }
  return new Map(
    packages.flatMap((entry) => {
      const published_at = entry.version === undefined ? undefined : optional_string(times_by_name.get(entry.name)?.[entry.version]);
      return published_at === undefined ? [] : [[package_id(entry), published_at] as const];
    }),
  );
};

function fail(reason: object): never {
  console.log(JSON.stringify({ kind: "audit_failed", ...reason }));
  process.exit(2);
}

const [base, head] = Bun.argv.slice(2);
if (base === undefined || head === undefined) fail({ reason: "usage: lock_audit.ts <base-ref> <head-ref>" });

const changed_files = (await $`git diff --name-only ${base}...${head}`.text()).split("\n").filter(Boolean);
const base_lock_text = await git_show({ file: "package-lock.json", ref: base });
const head_lock_text = await git_show({ file: "package-lock.json", ref: head });
if (base_lock_text === undefined || head_lock_text === undefined) fail({ reason: "package-lock.json missing at a ref" });

const base_lock = parse_lock(base_lock_text);
const head_lock = parse_lock(head_lock_text);
if (!base_lock.ok) fail({ ref: base, ...base_lock.error });
if (!head_lock.ok) fail({ ref: head, ...head_lock.error });
const base_entries = base_lock.value;
const head_entries = head_lock.value;

const changed = changed_entries({ base: base_entries, head: head_entries });
const installed_changed = changed.filter((entry) => entry.installed);
const manifests = await Promise.all(
  changed_files
    .filter((file) => /(^|\/)package\.json$/.test(file))
    .map(async (file) => {
      const [before, after] = await Promise.all([git_show({ file, ref: base }), git_show({ file, ref: head })]);
      const parse_or_undefined = (text: string | undefined) => {
        const parsed = text === undefined ? undefined : parse_json(text);
        return parsed?.ok ? parsed.value : undefined;
      };
      return { after: parse_or_undefined(after), before: parse_or_undefined(before), file };
    }),
);

const flags = [
  ...file_flags({ changed_files, manifests }),
  ...lock_flags({ base: base_entries, changed }),
  ...release_flags({
    now: new Date(),
    packages: installed_changed,
    publish_times: await fetch_publish_times(installed_changed),
  }),
];

for (const flag of flags) console.log(JSON.stringify(flag));
process.exit(flags.length === 0 ? 0 : 1);
