#!/usr/bin/env bash

# Get current dir (so run this script from anywhere)

export DOTFILES_DIR EXTRA_DIR
DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Update dotfiles itself first

[ -d "$DOTFILES_DIR/.git" ] && git --work-tree="$DOTFILES_DIR" --git-dir="$DOTFILES_DIR/.git" pull origin master

# Bunch of symlinks

ln -sfv "$DOTFILES_DIR/zsh/.bash_profile" ~
ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
ln -sfv "$DOTFILES_DIR/git/.gitignore_global" ~

# Package managers & packages

. "$DOTFILES_DIR/install/bash.sh"
. "$DOTFILES_DIR/install/npm.sh"
