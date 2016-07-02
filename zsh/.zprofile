#!/bin/zsh

if [ -d $HOME/.dotfiles/zsh/zprofile.d ]; then
  for file in $HOME/.dotfiles/zsh/zprofile.d/*.zsh; do
    source $file
  done
fi
