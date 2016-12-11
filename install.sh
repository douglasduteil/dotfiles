#!/usr/bin/env bash

# Get current dir (so run this script from anywhere)

export DOTFILES_DIR
DOTFILES_DIR=~/.dotfiles
#DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Updat e dotfiles itself first

[ -d "$DOTFILES_DIR/.git" ] && git --work-tree="$DOTFILES_DIR" --git-dir="$DOTFILES_DIR/.git" pull origin master

. "$DOTFILES_DIR/zsh/.zshenv"

# Bunch of symlinks
ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
ln -sfv "$DOTFILES_DIR/git/.gitignore_global" ~
mkdir -p `dirname $NPM_CONFIG_USERCONFIG`
ln -sfv "$DOTFILES_DIR/npm/.npmrc" "$NPM_CONFIG_USERCONFIG"
ln -sfv "$DOTFILES_DIR/zsh/.zprofile" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshenv" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshrc" ~

# Package managers & packages
. "$DOTFILES_DIR/install/zsh.sh"
. "$DOTFILES_DIR/install/zplug.sh"
. "$DOTFILES_DIR/install/fzf.sh"
. "$DOTFILES_DIR/install/nvm.sh"
. "$DOTFILES_DIR/install/npm.sh"
. "$DOTFILES_DIR/install/rvm.sh"
. "$DOTFILES_DIR/install/rsvm.sh"
. "$DOTFILES_DIR/install/cargo.sh"
. "$DOTFILES_DIR/install/ngrok.sh"
