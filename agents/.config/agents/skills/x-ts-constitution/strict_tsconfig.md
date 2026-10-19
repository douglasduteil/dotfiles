# Module: strict tsconfig

Adopt when a repo wants the `@tsconfig/strictest` flags that `@tsconfig/bun` leaves off. New repos start with it.

## What the bases set

- `@tsconfig/bun` already sets `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and explicitly turns off `noUnusedLocals`, `noUnusedParameters`, `noPropertyAccessFromIndexSignature`.
- `@tsconfig/strictest` 2.0.x adds on top: `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `allowUnreachableCode: false`, `allowUnusedLabels: false`, `isolatedModules`, `esModuleInterop`, `skipLibCheck`.
- `@tsconfig/node-ts`: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`.
- `@tsconfig/node-lts`: current Node LTS, `module: nodenext`, `types: ["node"]`.

`skipLibCheck: true` leaves third-party `.d.ts` unchecked, consistent with treating them as axioms (Article VI).

## Steps

One flag per PR, likely-bug catchers first:

1. `noImplicitReturns`
2. `noPropertyAccessFromIndexSignature`
3. `noUnusedLocals` and `noUnusedParameters`
4. `exactOptionalPropertyTypes` (largest error count)
5. Swap the separate flags for the `extends` chain below.

A small repo may do all five in one PR.

```json
{
  "extends": ["@tsconfig/bun/tsconfig.json", "@tsconfig/strictest/tsconfig.json"],
  "compilerOptions": { "erasableSyntaxOnly": true }
}
```

Later entries override earlier ones, so `strictest` goes last: no runtime base can loosen a strictness flag.

| Package | Extends, in this order |
| --- | --- |
| Shell on Bun | `bun`, `strictest`; set `erasableSyntaxOnly` |
| Shell on Node (server, worker, CLI) | `node-lts` (or a pinned `node24`), `node-ts`, `strictest` |
| Frontend (React with Vite) | `vite-react`, `strictest`; set `verbatimModuleSyntax`, `erasableSyntaxOnly` if missing |
| Core (pure core module) | `strictest` only |

Pin exact versions of the `@tsconfig/*` packages: they follow runtime versions, not semver.

## Why the non-obvious flags matter

- `noUncheckedIndexedAccess`: `arr[0]` and `record[key]` become `T | undefined`. Closes the most common silent hole.
- `exactOptionalPropertyTypes`: "absent" and "present but undefined" become different states, as they are at runtime.
- `erasableSyntaxOnly`: bans enums, namespaces and parameter properties. Code is plain JavaScript plus erasable types, which runs under Node and Bun type stripping.

## TS 7 notes

- TS 7 type-checks with 4 parallel checkers by default; the TS team notes that varying `--checkers` can surface order-dependent results. Pin `--checkers` in CI so local and CI runs agree (TS 7.0.2, 2026-10-19).

## Verify

`tsc --showConfig` lists every flag above as set; `tsc --noEmit` exits 0.
