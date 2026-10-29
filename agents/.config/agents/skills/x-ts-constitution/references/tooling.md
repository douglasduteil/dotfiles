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
- tsconfig chain: `@tsconfig/bun` on Bun, `@tsconfig/node-lts` plus
  `@tsconfig/node-ts` on Node, `@tsconfig/vite-react` on Vite. More strictness
  comes from the strict tsconfig module.

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

- Prettier default config, declared in `package.json` (not `.prettierrc`), with
  `prettier-plugin-organize-imports` (silent no-op on TS 7.0: see
  `js_tooling_gotchas.md`).
- `*.test.ts` next to the source it covers; `bun test` on Bun, vitest on Node
  and Vite.
- Assert the whole result: `expect(verdict).toEqual(ok(…))` or
  `toMatchObject({ ok: false, error: { … } })`, never
  `verdict.ok && verdict.value`: the `&&` hides the discriminant and compares
  `false` when the branch is wrong.
- Fix leftovers in files you touch.
