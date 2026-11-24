# Testing preferences

## Proof order: types first, tests last (user, 2026-11-19)

Single source for every language; `AGENTS.md` and `x-ts-constitution`
Article VII point here. Before writing a rule or a test, list its claims and
put each on the first rung that holds it:

1. **A type**: a union, a branded id, a schema that parses at the boundary,
   an exhaustive switch. Code containing the bug does not compile.
2. **A derivation**: one table built from another. Two hand-written tables
   that must agree become one table and a derivation.
3. **A module-load assertion** beside a constant table whose invariant no
   type states (distinct values, a one-to-one map). It fails on every boot
   and every test run.
4. **An integration test** per use case, through its runtime's entry point
   (request handler, CLI `main`, rendered page, message handler): its success
   path and each domain-error variant.
5. **A unit test** of a decision only when its cases outnumber what one
   integration test can enumerate: a property or a table of boundary values.
   Arithmetic, wiring and a rule a type already carries stay on rungs 1–4.

Name the bug before the test. When code containing it would not compile, or
a derivation makes it unwritable, write rung 1 or 2. A test that restates the
formula it checks catches nothing: pin the design value (`toBe(30)`), not the
formula (`toBe(BASE_FEE * 3 + DEPOSIT)`). An `??` default on a fresh field,
or a branch that "cannot happen", is the tell of a duplicated fact: remove
the duplicate rather than defend it.

### Integration tests follow user intent

- The name states what a user does and gets: "a member joining with an
  expired invite sees the expiry page".
- Assertions read only what that user or the next request observes (the
  response, the rendered text, a row read back through the API), never which
  internal function ran.
- Everything the app owns runs for real: its database in the test process
  (PGlite, mongodb-memory-server, SQLite), a container only for what the
  in-process engine lacks (locks, extensions, the message broker), its own
  services across a network too. A hand-written in-memory store is the
  port's fake only while the app owns no database; once one exists, it is a
  mock and the test runs on the real engine.
- A fake only for what the app neither owns nor can run (a third-party HTTP
  API, DNS, the clock), passed into the factory, the happy path by default.
- Coverage is a report, not a gate. Code no integration test reaches is a
  use case missing its test (write it) or dead code (delete it); a unit test
  is not the fix. A core function the user asked for before its use case
  exists keeps rung-5 boundary tests until that use case's integration test
  lands, then they go. An infrastructure-fault branch (timeout, dropped
  connection) is reached through an injected failing dependency.

### Where this overrides plugin skills

Plugin skills set different test defaults without contradicting this page
outright, so read each one through this list. In omp, `skills.manualSkills`
hides `tdd` from the skill list (2026-11-20): these entries bind when it is
loaded by hand, through `implement`, or in Claude Code, which cannot hide a
single plugin skill.

- `tdd`, `implement`: red is a compile error when rungs 1–3 can hold the
  claim; a failing test is the red only for rungs 4 and 5. A use case's seam
  is its runtime entry point; a lower seam is a rung-5 decision. Cycles
  follow use cases, not slices of a module.
- `tdd` `tests.md`: assert the whole result in one `toEqual` or
  `toMatchObject`, not one field of it.
- `tdd` `mocking.md`, `codebase-design` `DEEPENING.md`: the app's database,
  filesystem and its own remote services (dependency categories 2 and 3) run
  for real. A port over something the app owns needs a second production
  adapter; a test fake alone is not one. "Accept dependencies" is a shell
  rule: the core receives values. Internal-seam tests are rung 5 and meet its
  bar.
- `diagnosing-bugs` Phase 5: the regression proof is the
  lowest rung that holds the fix. When a type makes the bug unwritable, that
  type is the proof. Otherwise lift the minimised repro to the use case's
  entry point; the low-level repro stays a throwaway loop.

## Jest CPU limit

Never run jest (bare or via `npm test`/`yarn test`) at full CPU/worker
concurrency — it saturates all cores and can crash/hang the machine.
Always cap: `--maxWorkers=2` (or `=50%`) on any jest invocation used
for verification. Verification-only override — don't bake it into a
project's own package.json script unless asked.

## A green e2e test may assert nothing

Prove each assertion discriminates before trusting a pass: read the
before-state, or break the expectation once and watch it fail. Found in
one TS-service session (2026-09-22/23), all green for months:

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

Stated by the user 2026-10-14 (the API repo):

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
- Tag fixture identities with their role: `azrael+promoted@…`,
  `luther+kept-dirigeant@…`, `leman.russ+kept-other-domain@…`; a missing
  record is `notfound.world` / id `404` (user, 2026-10-29,
  an identity-provider codebase).

## Ad-hoc smoke tests stay throwaway (user, 2026-10-30)

A "tmp smoke test" is a script written, run once and deleted — never an
official test, never committed, never wired into CI. Run it against the real
service (self-hosted Sentry, live endpoint), print the evidence with secrets
masked, then remove the file. If the user wants a permanent guard, they ask for
a test explicitly.

## Test decisions, not data mapping

A plain ORM read (find by id/email, list by foreign key, select a
projection) needs no dedicated integration test: the ORM owns the row
mapping and the compiler checks the columns, so the test only restates the
SQL. Cover it through the use case that calls the read. A query gets its
own test only when it encodes a decision — a promotion rule, an upsert
conflict, a multi-row transaction, a lock. Stated 2026-10-29 (two service
codebases' repository layer; Jev calibration 0.19 against per-getter tests).

## Test size: one call shape, no scenario script (user, 2026-11-19)

A 45-line test that played three rounds in a row was refused as "too long".
What landed on rewrite: build the fixture once, drive the seam twice at most,
and assert the outcome as one `toMatchObject({ … })` of pinned literals. A test
whose length grows with its cases means the seam is too low — move up to the
use-case entry point.

## Prove a type change by using the API (user, 2026-11-12)

The rule lives in `x-ts-constitution` Article VII: a positive call whose
result is asserted. A refusal the type enforces is held by review and named
in the PR body, never by a `@ts-expect-error` check.

## A refactor proves parity on a deterministic harness (2026-11-21)

Extract HEAD beside the worktree (`git archive HEAD <dir> | tar -x -C "$(mktemp -d)"`, then
symlink `node_modules`), run the seeded harness in both, and `diff` the outputs: byte-identical
means the shape moved and the behaviour did not. Diff the default seeds after each commit and the
full seed range before writing numbers down. Scratch folders come from `mktemp -d`; the
`rm -rf /*` guard blocks deleting them, so leave cleanup to the user.

For a screen refactor, add the real page to the parity check: after identical harness output, navigate a WebView to the changed route, drive it through the affected state, screenshot it, and assert no error overlay. A module split passed types, unit tests and byte-identical seeded output, then crashed at load because a synchronous constant read from an async module handed back null (2026-11-24). Done when the page reaches the state after the changed module and the screenshot shows the intended screen.

## A review lead is a bug claim: prove it on the outcome (user, 2026-11-21)

- Judge a reviewed rule by what it produces, not by how its code reads. Two copies of a rule
  that agree on intermediate values can still disagree on the outcome (one chance rolled twice
  halves it); a test on an id's suffix can pick the wrong entity once spawn order changes.
- For a seeded or stochastic core: play many seeds through the real entry point, check
  invariants on every state, round-trip persistence every few states, and compare each decided
  chance with its observed rate within k standard deviations. Write the resolution down: at 4σ,
  n tries resolve a drift of 4·√(p(1−p)/n).
- Count rates on fresh random streams. A stream reseeded per area replays its draws on every
  visit, and selection on the replayed values skews the observed rate though each roll is fair.
- Before calling a rate a bug, find every writer of the field you count: an outcome reached by
  two paths inflated a measured rate with no game bug behind it.
- A gate is trusted once it fired: plant one bug per class it claims to catch in a scratch copy,
  watch each turn it red, and record the drift it misses.

## mongodb-memory-server on NixOS (mms 11.2, mongod 8.2.6, 2026-11-04)

- Default run fails: `Unknown/unsupported linux "<id>" id_like's: [nixos]`.
- `MONGOMS_DISTRO=ubuntu-22.04` downloads a binary, but it exits 127: NixOS can't run generic Linux binaries (stub-ld), and it lacks libcurl and libssl.
- nixpkgs-unstable libs need a newer glibc than the system one. Run the binary through that glibc's loader in a wrapper script:
  `exec <glibc>/lib/ld-linux-x86-64.so.2 --library-path <curl>/lib:<openssl>/lib:<glibc>/lib:<gcc-lib>/lib ~/.cache/mongodb-binaries/mongod-… "$@"`
  (paths from `nix build --no-link --print-out-paths nixpkgs#curl.out nixpkgs#openssl.out nixpkgs#glibc.out nixpkgs#stdenv.cc.cc.lib`)
- Then run jest with `MONGOMS_SYSTEM_BINARY=<wrapper> MONGOMS_VERSION=<version>`.
