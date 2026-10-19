# Module: pure core

Adopt when a repo has domain decisions worth testing without mocks (Article II): typically a new repo, or one module being retrofitted. Moving code into `src/core/` is the adoption step, one decision at a time.

## Steps

The core is a folder, `src/core/`, with its own `src/core/tsconfig.json`. Editors pick the nearest tsconfig, so the restriction shows while typing; no monorepo needed.

```json
{
  "extends": ["@tsconfig/strictest/tsconfig.json"],
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "lib": ["ES2023"],
    "module": "nodenext",
    "noEmit": true,
    "target": "ES2023",
    "types": [],
    "verbatimModuleSyntax": true
  }
}
```

- The core never extends a runtime base: `node-lts` sets `types: ["node"]` and `bun` sets `types: ["bun"]`, which bring `process` and `setTimeout` back. `types: []` is the TS 7 default; it stays explicit because the guarantee depends on it.
- `allowImportingTsExtensions` is required: without it `import "./x.ts"` fails with TS5097 under `nodenext`. Set `module` to match the shells that import the core.
- Without the DOM lib and runtime types, `fetch`, `process`, `console`, `setTimeout` and `localStorage` do not exist there; calling them is a compile error.

The ES lib still exposes `Date`, `Math.random` and `Intl`. With the oxlint type-aware module active, ban the first two and the shell imports:

```json
{
  "files": ["src/core/**"],
  "rules": {
    "no-restricted-globals": ["error", "Date"],
    "no-restricted-imports": ["error", { "patterns": ["\\#shell/**", "**/shell/**"] }],
    "no-restricted-properties": ["error", { "object": "Math", "property": "random" }]
  }
}
```

Without oxlint, review enforces them. `Intl` stays allowed because user-facing formatting goes through it, but its defaults read the host locale and time zone, so core code always passes `locale` and `timeZone` explicitly (review-enforced).

## Verify

A `fetch("x")` call added to a file under `src/core/` fails `tsc -p src/core`.
