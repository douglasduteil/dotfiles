# Baseline tooling detail

The baseline bullets in `SKILL.md` are the rules; this file carries the
version-sensitive detail behind them.

## TypeScript 7

- The `typescript` package ships the native `tsc` since 7.0 (2026-07-08).
- 7.0 has no compiler API until 7.1, so tools importing `typescript`
  (prettier-plugin-organize-imports, typescript-eslint, ts-morph) break, some
  silently: check `js_tooling_gotchas.md` before relying on one.
- TS 7 adopts the 6.0 defaults: `strict` on, `types: []`, `rootDir: ./`,
  `module: esnext`, `noUncheckedSideEffectImports` on.
- tsconfig chain: `@tsconfig/node-lts` plus `@tsconfig/node-ts` on Node,
  `@tsconfig/vite-react` on Vite. More strictness comes from the strict
  tsconfig module.
- On Bun, `@tsconfig/bun` 1.0.11 (2026-08-15) made the base self-sufficient:
  the whole `tsconfig.json` is `{ "extends": "@tsconfig/bun/tsconfig.json" }`.
  It sets `types: ["bun"]`, `target`/`lib` ESNext, `module: Preserve`,
  `moduleResolution: bundler`, `verbatimModuleSyntax`,
  `allowImportingTsExtensions`, `noEmit`, `moduleDetection: force`,
  `jsx: react-jsx`, `allowJs` and `strict` with the index/member checks.
  Because it sets `types: ["bun"]`, `@types/bun` is a devDependency: without
  it `bun check` stops on TS2688 instead of checking. A repo that
  compiles with `tsc` must turn `noEmit` off and drop
  `allowImportingTsExtensions` with it.

## Module resolution through `package.json`

`#imports` and `#exports` replace `../../` traversal; add an `imports` key once a
path needs `../../../`.

- Every `*` in a target receives the same matched text, so `./libs/*/src/*.ts`
  cannot work. Use a barrel key `#libs/*` → `./libs/*/src/index.ts` plus one
  `#libs/<lib>/*` key per lib (longest prefix wins).
- Targets get no extension or index lookup: map to `*.ts`, write `/index` for
  folder imports.
- With `outDir` set, `tsc` also needs `rootDir`, else TS2210 (found on TS 5.x,
  2026-10-09; re-check under TS 7, whose `rootDir` default is `./`).

## Formatting and tests

- Bun 1.4.4 carries both tools natively, so a Bun package needs
  neither `tsc` nor Prettier: `bun check` type-checks the nearest
  `tsconfig.json` on all cores (project references like `tsc -b`; `-p` for
  another package), and `bun fmt` formats Prettier-compatibly. `bun run
  --check` runs the check before the script.
- `bun fmt` settings live in a `[fmt]` section of `bunfig.toml` (`bun fmt
  --init` writes one); an existing Prettier config is read as well. Import
  sorting and merging is native (`[fmt] sortImports = true`), since `bun fmt`
  loads no Prettier plugins: `prettier-plugin-organize-imports` serves Node
  and Vite repos only. `--check` is the CI form (exit 1 when a file needs
  formatting), `--staged` formats what git staged and re-stages it, and
  `--doctor` lists the Prettier packages a repo can drop.
- Prettier default config on Node and Vite, declared in `package.json` (not
  `.prettierrc`), with `prettier-plugin-organize-imports` (silent no-op on
  TS 7.0: see `js_tooling_gotchas.md`).
- `*.test.ts` next to the source it covers; `bun test` on Bun, vitest on Node
  and Vite.
- Assert the whole result: `expect(verdict).toEqual(ok(…))` or
  `toMatchObject({ ok: false, error: { … } })`, never
  `verdict.ok && verdict.value`: the `&&` hides the discriminant and compares
  `false` when the branch is wrong.
- Fix leftovers in files you touch.
