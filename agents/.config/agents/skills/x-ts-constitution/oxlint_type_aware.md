# Module: oxlint type-aware

Adopt when a repo lints with oxlint, or wants to, and runs TypeScript 7: tsgolint v7 is built on TS 7 and is stable since 2026-07-22 (59 of typescript-eslint's 61 type-aware rules).

## Stages

New rules go in as `error`, never `warn`: warnings pile up unread. Existing violations go into oxlint's bulk-suppressions file (since 2026-05-06, oxc#19328); new ones fail. The file only shrinks, and the hatch ledger module counts it. Check `oxlint --help` for the installed version's suppression flags (the RFC named `--suppress-all` and `--prune-suppressions`).

1. **Stage 0**: oxlint with its default rules, no type information.
2. **Stage 1**: install `oxlint-tsgolint`, set `options.typeAware`, enable `typescript/no-floating-promises`, `typescript/no-misused-promises`, `typescript/switch-exhaustiveness-check`.
3. **Stage 2**: add the remaining rules of the target config below, one per PR.

Pin `oxlint-tsgolint` to the repo's TypeScript version: its version encodes it (`7.0.2000` is tsgolint patch 0 for TS 7.0.2). `options.typeCheck: true` also reports `tsc` diagnostics from the same program, replacing a separate `tsc --noEmit` step.

## Target config

oxlint has no `strictTypeChecked` preset, so rules are listed by name:

```json
{
  "options": { "typeAware": true },
  "rules": {
    "typescript/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description", "ts-ignore": true }],
    "typescript/consistent-type-assertions": ["error", { "assertionStyle": "never" }],
    "typescript/no-explicit-any": "error",
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/only-throw-error": "error",
    "typescript/strict-boolean-expressions": "error",
    "typescript/switch-exhaustiveness-check": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts"],
      "rules": { "typescript/consistent-type-assertions": "off" }
    }
  ]
}
```

The pure core module adds an override for `src/core/**`.

## Gotchas

- `no-restricted-imports` patterns are `.gitignore` syntax and match the specifier as written, not the resolved path: escape a leading `#` (`"\\#shell/**"`), and `*` does not cross `/` (use `**`). Ban both the `#` alias and the relative path (2026-10-03).
- A later `overrides` entry replaces a rule for the files it matches, so a stricter folder repeats the base patterns (2026-10-03).
- oxlint installed outside the project (a throwaway `/tmp` install) needs `OXLINT_TSGOLINT_PATH=<dir>/node_modules/.bin/tsgolint`, else type-aware runs fail with "Failed to find tsgolint executable" (2026-10-14).

## Verify

`oxlint --type-aware` exits 0; a seeded floating promise (`fetch(url);` without `await`) fails it.
