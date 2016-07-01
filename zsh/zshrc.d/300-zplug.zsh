#!/bin/zsh

# ===========================================================================
# Init zplug
# ===========================================================================

# First-time run: need to download zplug if it doesn't exist
# [[ -f $ZPLUG_HOME/zplug ]] || (echo "zplug missing, please install http://git.io/zplug to $ZPLUG_HOME" && exit 1)
# source $ZPLUG_HOME/zplug

# ===========================================================================
# Plugins
# ===========================================================================

# Essential
source $ZPLUG_HOME/init.zsh

zplug "b4b4r07/zplug"

# Plugins
zplug "zsh-users/zsh-syntax-highlighting", nice:10
zplug "zsh-users/zsh-history-substring-search"
zplug "zsh-users/zsh-completions"
zplug "mafredri/zsh-async"

zplug "lib/completion", from:oh-my-zsh
zplug "lib/directories", from:oh-my-zsh
zplug "lib/grep", from:oh-my-zsh
zplug "lib/key-bindings", from:oh-my-zsh
zplug "plugins/docker", from:oh-my-zsh
zplug "plugins/gradle", from:oh-my-zsh, nice:10
zplug "plugins/sudo", from:oh-my-zsh

zplug "junegunn/fzf-bin", as:command, from:gh-r, rename-to:"fzf"
zplug "b4b4r07/enhancd", use:enhancd.sh

# Theme
zplug "sindresorhus/pure"

# Install plugins that have not been installed yet
if ! zplug check --verbose; then
  zplug install
fi

zplug load



# ===========================================================================
# Install plugins
# ===========================================================================

# Install plugins if they've not been installed
if ! zplug check --verbose; then
  printf "Install? [y/N]: "
  if read -q; then
    echo; zplug install
  fi
fi

# ===========================================================================
# Load plugins
# ===========================================================================

zplug load

# ===========================================================================
#
# ===========================================================================
