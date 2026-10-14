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

## Test fixtures say only what the case is about

Stated by the user 2026-10-14 (api-partenaires #130/#131):

- No single-use module globals in a test file: build the value inside the
  test that uses it. Keep a constant only when several tests share it.
- Request bodies carry only the data the case is about. A filler value the
  route skips (an already-attached domain next to the new one) made a
  response look wrong; it read as a bug.
- The fixture's default fake is the happy path (all domains reachable);
  a failing case overrides it in its own test.
- Disable a numeric limit with `Infinity`, not a big magic number.
- Pass the dependency (`fetch`, clock) into the factory; don't mock a global.
- Name test data after what happens to it: `mairie-de-nulle-part.fr`
  (does not resolve), `dns-en-greve.fr` (DNS on strike). Humor welcome.
