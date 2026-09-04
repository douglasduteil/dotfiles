![](https://raw.githubusercontent.com/jglovier/dotfiles-logo/master/dotfiles-logo.png)

# nixos-wsl

User-level Nix profile for NixOS-WSL machines: stow-managed dotfiles plus a locked package flake.

## Contents

- `nix` (stow package) — `~/.config/nix/nix.conf` (enables `nix-command`/`flakes`) and `~/.config/nixpkgs/config.nix` (`allowUnfree`)
- `git` (stow package) — `~/.gitconfig` (identity, plus `[include] path = ~/.config/git/gitconfig` for the untracked per-machine default signing key) and `~/.config/git/allowed_signers` (FIDO2 SSH signing verification, both keys)
- `ssh` (stow package) — `~/.ssh/config`, pointing github.com at both FIDO2 signing keys via `IdentityFile` (`IdentitiesOnly yes`); ssh tries the first and falls back to the second, so whichever key is physically plugged in works. No key material lives here -- only paths (see SSH commit signing)
- `nvim` (stow package) — LazyVim config vendored from [LazyVim/starter](https://github.com/LazyVim/starter) into `~/.config/nvim`
- `zsh` (stow package) — `~/.zshenv` (XDG vars) and `~/.zshrc` (oh-my-zsh libs/plugins, autosuggestions, syntax highlighting, history search, fzf, starship — all nix-managed, no runtime plugin manager)
- `claude` (stow package) — `~/.config/claude/settings.json` (theme, attribution trailers off, etc.) and `~/.config/claude/skills/`. `zsh/.zshenv` sets `CLAUDE_CONFIG_DIR` to relocate Claude Code's whole config dir here (settings, credentials, transcripts, caches) instead of `~/.claude` -- only `settings.json` and `skills/` are version-controlled. `~/.claude` itself is kept as a plain symlink to `~/.config/claude` (see Install) so anything that still hardcodes the old path lands on the same live state instead of silently writing to a stale duplicate
- `packages` (flake, not stowed) — a locked `flake.lock` pinning the exact nixpkgs revision for everything above plus the rest of the CLI toolset; see `packages/flake.nix` for the current list rather than duplicating it here

## Install

```sh
git clone -b nixos-wsl --single-branch git@github.com:douglasduteil/dotfiles.git ~/.dotfiles

# dotfiles: nix.conf/config.nix, git identity, ssh config, neovim config, zsh config, claude settings
nix-shell -p stow --run 'stow -d ~/.dotfiles -t ~ nix git ssh nvim zsh claude'

# packages: pinned via packages/flake.lock
nix profile install ~/.dotfiles/packages#default
```

On a machine that hasn't stowed `nix` yet (so `nix-command`/`flakes` aren't enabled), run the package install with the flags inline instead:

```sh
nix --extra-experimental-features "nix-command flakes" profile install ~/.dotfiles/packages#default
```

`nix-shell -p stow` (rather than `nix profile install nixpkgs#stow`) sidesteps a chicken-and-egg problem: a flake install needs `nix-command`/`flakes` already enabled, which is exactly what the stowed `nix.conf` provides.

Set zsh as the login shell separately, declaratively, in `/etc/nixos/configuration.nix`:

```nix
programs.zsh.enable = true;
users.users.<you>.shell = pkgs.zsh;
```

`CLAUDE_CONFIG_DIR` doesn't migrate an existing install automatically -- on a machine with prior Claude Code state, move it over once, in a fresh shell that already has `CLAUDE_CONFIG_DIR` set:

```sh
rsync -a ~/.claude/ ~/.config/claude/   # skip settings.json, which stow provides
cp -a ~/.claude.json ~/.config/claude/.claude.json   # this one lives in $HOME, not ~/.claude/
```

Do this before first starting `claude` in the new shell -- otherwise it finds no `.claude.json` at the new path and silently starts a fresh one, and the real state has to be copied over it afterward.

Then retire the old `~/.claude` directory in favor of a symlink, so any tool that still looks there transparently hits the same live state (stow can't express this itself -- it only mirrors package content into place, and the target here is `~/.config/claude`, not repo content):

```sh
mv ~/.claude ~/.claude.bak-$(date +%Y%m%d-%H%M%S)   # keep as a safety net, don't delete
ln -s ~/.config/claude ~/.claude
```

## SSH commit signing

Commits are signed with a hardware-backed FIDO2 key (`sk-ssh-ed25519`). There are two physical YubiKeys, `alpha` and `beta` -- **not** one per machine; either one works from any machine, each acting as the other's backup. Both keys' private-key handle files (the FIDO2 credential wrapper OpenSSH stores on disk -- not the underlying secret, which never leaves the hardware) are copied to *every* machine, named `~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>`, e.g. `git_signing_key_Y5C-beta-36628851` for a YubiKey 5C NFC (`ykman info` prints model/serial). These files are never tracked by `~/.dotfiles`.

`ssh/.ssh/config` lists both as `IdentityFile`s unconditionally, so `ssh` (and therefore `git push`/`fetch`) transparently uses whichever key is physically plugged in. Commit *signing* needs one definite default though (`user.signingkey` can't try-and-fall-back like `ssh` does), so that part alone stays a small per-machine, untracked include -- picking which of the two keys this machine reaches for first:

```sh
# machine-local, not tracked -- swap to the other filename any time
# you're signing with the other physical key instead
mkdir -p ~/.config/git
printf '[user]\n\tsigningkey = ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>\n' \
  > ~/.config/git/gitconfig
```

(To sign a single commit with the *other* key without changing the default: `git -c user.signingkey=~/.ssh/git_signing_key_<other> commit ...`.)

**A machine that already has both keys' handle files** just needs that one file dropped in -- `git`/`ssh` are already stowed and need nothing else.

**A genuinely new key** (replacing a lost/retired YubiKey) needs generating once and registering in two places -- the only steps that can't be done by `stow`, since they're either hardware-bound or live on GitHub's own servers:

```sh
# generate -- prompts for a security-key touch (and possibly a PIN,
# depending on the key's own FIDO2 policy)
ssh-keygen -t ed25519-sk -f ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial> \
  -C "git-signing-<model>-<alpha|beta>-<serial>"

# register the public half for local signature verification
# (tracked -- commit and push this from ~/.dotfiles)
echo "$(git config user.email) $(cat ~/.ssh/git_signing_key_<...>.pub)" \
  >> ~/.dotfiles/git/.config/git/allowed_signers
```

Then also add its `IdentityFile` line to `ssh/.ssh/config` (tracked -- commit and push), copy the new handle file to every other machine, and register the same public key on GitHub itself under *Settings → SSH and GPG keys*: once as an **Authentication Key** (needed for `git push`/`fetch` over SSH) and once as a **Signing Key** (needed for the green "Verified" badge -- `allowed_signers` only covers local `git log --show-signature` verification, GitHub keeps its own separate copy).

## Updating the package set

Edit `packages/flake.nix`, then from `packages/`:

```sh
nix flake lock --update-input nixpkgs   # bump to latest nixpkgs-unstable
nix profile upgrade default             # apply on this machine
```

## Inspired by

- [`master`](https://github.com/douglasduteil/dotfiles/tree/master) — the flat, stow-shaped dotfiles layout this branch follows
- [`nix`](https://github.com/douglasduteil/dotfiles/tree/nix) — the sibling branch for machines where Nix runs standalone (home-manager, non-NixOS); this branch is the real-NixOS counterpart
