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

## mongodb-memory-server on NixOS (mms 11.2, mongod 8.2.6, 2026-11-04)

- Default run fails: `Unknown/unsupported linux "<id>" id_like's: [nixos]`.
- `MONGOMS_DISTRO=ubuntu-22.04` downloads a binary, but it exits 127: NixOS can't run generic Linux binaries (stub-ld), and it lacks libcurl and libssl.
- nixpkgs-unstable libs need a newer glibc than the system one. Run the binary through that glibc's loader in a wrapper script:
  `exec <glibc>/lib/ld-linux-x86-64.so.2 --library-path <curl>/lib:<openssl>/lib:<glibc>/lib:<gcc-lib>/lib ~/.cache/mongodb-binaries/mongod-… "$@"`
  (paths from `nix build --no-link --print-out-paths nixpkgs#curl.out nixpkgs#openssl.out nixpkgs#glibc.out nixpkgs#stdenv.cc.cc.lib`)
- Then run jest with `MONGOMS_SYSTEM_BINARY=<wrapper> MONGOMS_VERSION=<version>`.
