#!/usr/bin/env bash

# Get current dir (so run this script from anywhere)

export DOTFILES_DIR EXTRA_DIR
DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Updat e dotfiles itself first

[ -d "$DOTFILES_DIR/.git" ] && git --work-tree="$DOTFILES_DIR" --git-dir="$DOTFILES_DIR/.git" pull origin master

# Bunch of symlinks

ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
ln -sfv "$DOTFILES_DIR/git/.gitignore_global" ~
ln -sfv "$DOTFILES_DIR/npm/.npmrc" ~
ln -sfv "$DOTFILES_DIR/zsh/.zprofile" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshenv" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshrc" ~

# Package managers & packages

. "$DOTFILES_DIR/install/npm.sh"
. "$DOTFILES_DIR/install/zsh.sh"
. "$DOTFILES_DIR/install/fzf.sh"
. "$DOTFILES_DIR/install/zplug.sh"
