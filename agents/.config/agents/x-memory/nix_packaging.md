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
