#!/usr/bin/env bash

# Get current dir (so run this script from anywhere)

export DOTFILES_DIR
DOTFILES_DIR=~/.dotfiles
#DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Update dotfiles itself first

# [ -d "$DOTFILES_DIR/.git" ] && git --work-tree="$DOTFILES_DIR" --git-dir="$DOTFILES_DIR/.git" pull origin master

. "$DOTFILES_DIR/zsh/.zshenv"

# Bunch of symlinks
ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
ln -sfv "$DOTFILES_DIR/git/.gitignore_global" ~
mkdir -p `dirname $NPM_CONFIG_USERCONFIG`
ln -sfv "$DOTFILES_DIR/npm/.npmrc" "$NPM_CONFIG_USERCONFIG"
ln -sfv "$DOTFILES_DIR/zsh/.zprofile" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshenv" ~
ln -sfv "$DOTFILES_DIR/zsh/.zshrc" ~


# ln -sfv "$HOME/.vscode-server" "$XDG_PROGRAMS_DIR/zsh/.vscode-server"

# Package managers & packages
. "$DOTFILES_DIR/install/pacman.sh"
. "$DOTFILES_DIR/install/zinit.sh"
# . "$DOTFILES_DIR/install/fzf.sh"
# . "$DOTFILES_DIR/install/svm.sh"
# # . "$DOTFILES_DIR/install/rvm.sh"
. "$DOTFILES_DIR/install/rustup.sh"
. "$DOTFILES_DIR/install/cargo.sh"
# # . "$DOTFILES_DIR/install/ngrok.sh"
. "$DOTFILES_DIR/install/yay.sh"
. "$DOTFILES_DIR/install/snm.sh"

# . "$DOTFILES_DIR/zsh/zshrc.d/200-zinit.zsh"
# . "$DOTFILES_DIR/zsh/zshrc.d/201-zinit-load.zsh"
