#!/bin/zsh

if [ -d $HOME/.dotfiles/zsh/zshenv.d ]; then
  for file in $HOME/.dotfiles/zsh/zshenv.d/*.zsh; do
    source $file
  done
fi
