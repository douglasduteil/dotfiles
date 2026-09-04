# Contributing

## Minimum-effort setup

The point of this repo is that a new machine gets configured by running
`stow`, not by following a checklist. When adding or changing anything
here, default to expressing it as files `stow` can symlink into place,
not as a manual step in the README.

Concretely:

- If a setting can live in a file under a package directory (`nix/`,
  `git/`, `ssh/`, `zsh/`, `claude/`, ...), put it there instead of
  writing "then run `git config ...`" or "then edit `~/.foo`" in the
  README.
- A README manual step is only acceptable when `stow` genuinely can't
  do it: generating something hardware-bound (a FIDO2 key), moving
  live state that isn't repo content (`~/.claude` -> symlink), calling
  an external service (registering a key with GitHub). Even then, cut
  it down to the fewest commands that actually can't be automated away
  -- don't leave a stow-able step next to an unavoidable one just
  because they were discovered together.
- Before adding a new manual step, check whether restructuring what's
  being configured removes the need for it entirely. Renaming the FIDO2
  signing-key files to a scheme that's the same shape on every machine
  is what let `user.signingkey`'s file *reference* move from a
  per-machine include into a single stowed line -- the underlying
  per-machine choice of default key still needs one, small, documented
  override, but nothing else does.
- Prefer one obviously-correct stowed default over several documented
  variants. If a step can't be removed, it should still only need to
  be done once, not re-derived per machine.
