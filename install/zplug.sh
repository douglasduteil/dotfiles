#!/bin/zsh

source ~/.dotfiles/zsh/zshenv.d/001-zplug.zsh

[[ -d $ZPLUG_HOME ]] || {
  git clone https://github.com/b4b4r07/zplug $ZPLUG_HOME
  source $ZPLUG_HOME/init.zsh && zplug update --self
}
