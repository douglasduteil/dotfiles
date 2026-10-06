#!/usr/bin/env bash
# Idempotent install: stows every package into $HOME. Safe to rerun any
# time (e.g. after adding a package or pulling changes) -- `stow -R`
# restows cleanly whether or not it's already stowed.
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES=(nix git ssh nvim zsh agents atuin omp)

if ! command -v stow >/dev/null 2>&1; then
  echo "stow not found; run: nix-shell -p stow --run '$0'" >&2
  exit 1
fi

# ~/.config/claude, ~/.config/git, ~/.config/opencode and ~/.omp/agent also
# hold real, untracked, per-machine files (Claude Code credentials/sessions/caches;
# git's signingkey include; opencode's own plugin node_modules/package.json;
# omp's auth/sessions/caches) alongside the stowed ones. Pre-creating them as
# real directories keeps stow from folding the whole subtree into a single
# symlink -- see README's Install section. ~/.config/agents holds nothing
# untracked (yet), so it's left for stow to fold fully.
mkdir -p ~/.config/claude ~/.config/git ~/.config/opencode ~/.omp/agent

# ssh config's ControlPath points git/ssh's connection-multiplexing socket
# here; ssh won't create the directory itself, so a fresh machine (or one
# that pruned ~/.ssh) fails every push/fetch with "unix_listener: cannot
# bind to path ... No such file or directory" until it exists.
mkdir -p ~/.ssh/sockets

stow -d "$DOTFILES_DIR" -t "$HOME" -R "${PACKAGES[@]}"

# Anything that still hardcodes ~/.claude or ~/.agents lands on the same
# live state instead of a stale duplicate.
for name in claude agents; do
  link=~/."$name"
  target=~/.config/"$name"
  if [ ! -e "$link" ] || [ -L "$link" ]; then
    ln -sfn "$target" "$link"
  else
    echo "~/.$name exists and isn't a symlink -- leaving it alone" >&2
  fi
done

# typescript-mcp (packages/flake.nix) registered user-scope so every project
# gets TS7/tsgo-backed go-to-def/find-references/hover/diagnostics. Claude
# Code has no settings.json key for this -- registration lives in the
# stateful ~/.claude.json, so it's done here idempotently rather than
# checked into the repo.
if command -v claude >/dev/null 2>&1 && command -v typescript-mcp >/dev/null 2>&1; then
  if ! claude mcp get typescript-mcp >/dev/null 2>&1; then
    claude mcp add --scope user typescript-mcp -- "$(command -v typescript-mcp)"
  fi
fi
