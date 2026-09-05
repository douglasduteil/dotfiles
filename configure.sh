#!/usr/bin/env bash
# Idempotent install: stows every package into $HOME. Safe to rerun any
# time (e.g. after adding a package or pulling changes) -- `stow -R`
# restows cleanly whether or not it's already stowed.
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES=(nix git ssh nvim zsh agents)

if ! command -v stow >/dev/null 2>&1; then
  echo "stow not found; run: nix-shell -p stow --run '$0'" >&2
  exit 1
fi

# ~/.config/claude, ~/.config/git and ~/.config/opencode also hold real,
# untracked, per-machine files (Claude Code credentials/sessions/caches;
# git's signingkey include; opencode's own plugin node_modules/package.json)
# alongside the stowed ones. Pre-creating them as real directories keeps
# stow from folding the whole subtree into a single symlink -- see
# README's Install section. ~/.config/agents holds nothing untracked
# (yet), so it's left for stow to fold fully.
mkdir -p ~/.config/claude ~/.config/git ~/.config/opencode

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
