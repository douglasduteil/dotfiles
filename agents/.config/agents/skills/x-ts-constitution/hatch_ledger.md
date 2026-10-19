# Module: hatch ledger

Adopt when a repo has CI and at least one hatch to count, usually once the oxlint type-aware module reaches stage 1. This is the TypeScript `#print axioms`: one number that says how much of the codebase rests on trust.

## Steps

1. **Count** on every pull request, outside `*.test.ts`:
   - `oxlint-disable` directives
   - `@ts-expect-error` comments
   - entries in oxlint's bulk-suppressions file
2. **Fail CI** when the total grows. Growth passes only with an explicit review note in the PR.
3. **Snapshot the compiler config**: CI commits `tsc --showConfig` output per package and fails when it changes, so a base upgrade (`@tsconfig/*`, TypeScript itself) cannot loosen a flag silently.

Tests may use `as` freely and are not counted (Article VI).

## Verify

Adding one `// oxlint-disable-next-line` without a review note turns CI red; removing one lowers the recorded total.
