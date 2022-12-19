#!/bin/zsh

local -x ZSHRC="$DOTFILES_DIR/zsh/zshrc.d/200-zinit.zsh"
local -x ZINIT_INSTALL_DIR="$ZINIT_HOME"
local -x ZINIT_REPO_DIR_NAME="zinit"
local -x ZINIT_HOME="$XDG_PROGRAMS_DIR"
local -x NO_TUTORIAL="NO_TUTORIAL"
local -x NO_EDIT="NO_EDIT"

bash -c "$(
curl \
  --fail \
  --show-error \
  --silent \
  --location https://raw.githubusercontent.com/zdharma-continuum/zinit/HEAD/scripts/install.sh
)"

zcompile $ZINIT_INSTALL_DIR/zinit.zsh
