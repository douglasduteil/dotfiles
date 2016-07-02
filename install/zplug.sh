#!/bin/zsh

[[ -d $ZPLUG_HOME ]] || {
  echo ""
  echo "=> Installing zPlug in $ZPLUG_HOME"
  git clone --depth 1 https://github.com/b4b4r07/zplug $ZPLUG_HOME
  chmod +x $ZPLUG_HOME/init.zsh $ZPLUG_HOME/zplug
  source $ZPLUG_HOME/init.zsh && zplug update --self
}
