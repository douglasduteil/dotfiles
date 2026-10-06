# Testing preferences

## Jest CPU limit

Never run jest (bare or via `npm test`/`yarn test`) at full CPU/worker
concurrency — it saturates all cores and can crash/hang the machine.
Always cap: `--maxWorkers=2` (or `=50%`) on any jest invocation used
for verification. Verification-only override — don't bake it into a
project's own package.json script unless asked.

## A green e2e test may assert nothing

Prove each assertion discriminates before trusting a pass: read the
before-state, or break the expectation once and watch it fail. Found in
one hyyypertool session (2026-09-22/23), all green for months:

- a wait helper that returns `false` on timeout instead of throwing,
  awaited bare — asserted nothing;
- a modal checked for *existence* in the DOM, not visibility — it never
  opened (click landed before island hydration);
- a search step that was a no-op (tool bug: typing into an unfocused
  input) — passed because the unfiltered list still showed the row.

Pick assertions only the post-action state can satisfy.

## Reproduce CI-only flakes by pinning CPUs

A flake seen only on a slow CI runner usually reproduces locally under
CPU starvation: `taskset -c 0,1 <suite command>`, 5+ runs in a row. A
fix isn't verified until that loop stays green.
