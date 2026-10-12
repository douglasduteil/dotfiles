# Nix packaging

## Computing `vendorHash` / source hash without a lookup service

For `buildGoModule` (or similar fixed-output-derivation hashes), don't
guess or trust an upstream-published hash:

- **Source hash**: `nix-prefetch-url --unpack <tarball-url>` (e.g. a
  GitHub `archive/refs/tags/<tag>.tar.gz` URL) prints the real
  sha256 directly.
- **`vendorHash`**: set it to `pkgs.lib.fakeHash;` first, run
  `nix-build`. The build fails with a hash-mismatch error whose
  `got: sha256-...` line is the real hash — paste that in and rebuild.

Both steps need network access (fetching the tarball / go modules) but
no external hash database or manual trust decision.

## Pinning an external binary into a flake profile

Pattern used in `~/.dotfiles/packages/flake.nix` (see `typescript-mcp`
for a worked example): define the derivation in the `let` block
(`pkgs.buildGoModule { ... }` with `fetchFromGitHub` pinned to a tag,
`subPackages` trimmed to just the binary actually needed), then
reference it by name in the `buildEnv` package list. Keeps the list
alpha-ordered and avoids pulling in extra binaries (e.g. test clients)
the derivation's repo also builds.

## TS7 native (`tsgo`) packages

- `@typescript/native-preview*` was the preview channel for TS7's native
  Go build, and it dead-ends at `7.0.0-dev.20260707.2` (2026-07-07). Stable
  TS7 publishes the same build as platform packages `@typescript/<plat>`
  (`@typescript/typescript-linux-x64` 7.0.2); the `next` dist-tag there
  tracks the nightly (`7.1.0-dev.…`). Check `dist-tags` on the *platform*
  package, not on `@typescript/native-preview`, when looking for the
  current build.
- nixpkgs now packages it as `typescript` (the `typescript-go` attribute was
  replaced by it) but exposes only `bin/tsc` — no `tsgo`. A consumer that
  looks up the `tsgo` name (typescript-mcp spawns `tsgo --lsp --stdio`) still
  needs its own derivation. `pkgs.typescript` is fine as the source when only
  a wrapper name is missing; the npm platform tarball is fine when the exact
  artifact must be pinned.
- npm's `dist.integrity` in `registry.npmjs.org/<pkg>/<version>` is an SRI
  sha512 that drops straight into `fetchurl.hash` — no prefetch run needed.
  The tarball hash stays valid across npm republishes only because npm
  forbids republishing a version.
- Layout: the binary and its `lib/*.d.ts` siblings sit in one directory and
  it resolves them relative to its own executable, so they must ship
  together — copy `lib/` into `$out/libexec` and symlink the wanted name into
  `$out/bin`.
- Cheap proof that a replaced LSP binary still speaks the protocol: frame an
  `initialize` request as `Content-Length: N\r\n\r\n` + JSON, pipe it into
  `tsgo --lsp --stdio`, expect a `capabilities` result. Runs in seconds and
  catches a non-LSP binary (the JS `tsc` has no `--lsp`) without building the
  consumer.
