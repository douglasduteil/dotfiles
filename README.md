![](https://raw.githubusercontent.com/jglovier/dotfiles-logo/master/dotfiles-logo.png)

# nixos-wsl

User-level Nix profile for NixOS-WSL machines: stow-managed dotfiles plus a locked package flake.

## Contents

- `nix` (stow package) — `~/.config/nix/nix.conf` (enables `nix-command`/`flakes`) and `~/.config/nixpkgs/config.nix` (`allowUnfree`)
- `git` (stow package) — `~/.gitconfig`, `~/.gitignore_global`, and `~/.config/git/allowed_signers` (FIDO2 SSH signing verification; `user.signingkey` itself is set per-machine via the untracked `~/.config/git/gitconfig` include)
- `nvim` (stow package) — LazyVim config vendored from [LazyVim/starter](https://github.com/LazyVim/starter) into `~/.config/nvim`
- `zsh` (stow package) — `~/.zshenv` (XDG vars) and `~/.zshrc` (oh-my-zsh libs/plugins, autosuggestions, syntax highlighting, history search, fzf, starship — all nix-managed, no runtime plugin manager)
- `claude` (stow package) — `~/.config/claude/settings.json` (theme, attribution trailers off, etc.). `zsh/.zshenv` sets `CLAUDE_CONFIG_DIR` to relocate Claude Code's whole config dir here (settings, credentials, transcripts, caches) instead of `~/.claude` -- only `settings.json` is version-controlled
- `packages` (flake, not stowed) — a locked `flake.lock` pinning the exact nixpkgs revision for everything above plus the rest of the CLI toolset; see `packages/flake.nix` for the current list rather than duplicating it here

## Install

```sh
git clone -b nixos-wsl --single-branch git@github.com:douglasduteil/dotfiles.git ~/.dotfiles

# dotfiles: nix.conf/config.nix, git identity, neovim config, zsh config, claude settings
nix-shell -p stow --run 'stow -d ~/.dotfiles -t ~ nix git nvim zsh claude'

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

## Updating the package set

Edit `packages/flake.nix`, then from `packages/`:

```sh
nix flake lock --update-input nixpkgs   # bump to latest nixpkgs-unstable
nix profile upgrade default             # apply on this machine
```

## Inspired by

- [`master`](https://github.com/douglasduteil/dotfiles/tree/master) — the flat, stow-shaped dotfiles layout this branch follows
- [`nix`](https://github.com/douglasduteil/dotfiles/tree/nix) — the sibling branch for machines where Nix runs standalone (home-manager, non-NixOS); this branch is the real-NixOS counterpart
