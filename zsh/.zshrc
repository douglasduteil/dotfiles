#!/bin/zsh

if [[ $- != *i* ]] ; then
  # shell is non-interactive. be done now!
  return
fi

if [ -d $HOME/.dotfiles/zsh/zshrc.d ]; then
  for file in $HOME/.dotfiles/zsh/zshrc.d/*.zsh; do
    source $file
  done
fi

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"
