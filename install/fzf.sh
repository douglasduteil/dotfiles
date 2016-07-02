#!/bin/zsh

local FZF_DIR=$XDG_PROGRAMS_DIR/fzf

[[ -d $FZF_DIR ]] || {
  echo ""
  echo "=> Installing fzf in $FZF_DIR"
  git clone --depth 1 https://github.com/junegunn/fzf.git $FZF_DIR
  $FZF_DIR/install
}
