#!/bin/zsh

# ===========================================================================
# Init zplug
# ===========================================================================

# First-time run: need to download zplug if it doesn't exist
[[ -f $ZPLUG_HOME/zplug ]] || {
  echo "zplug missing in $ZPLUG_HOME"
  return
}

# ===========================================================================
# Plugins
# ===========================================================================

# Essential
source $ZPLUG_HOME/init.zsh

zplug "zplug/zplug"

# Plugins
zplug "zsh-users/zsh-syntax-highlighting", nice:10
zplug "zsh-users/zsh-autosuggestions", nice:10
zplug "zsh-users/zsh-history-substring-search"
zplug "zsh-users/zsh-completions"
zplug "mafredri/zsh-async"

zplug "lib/clipboard", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/completion", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/correction", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/directories", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/grep", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/history", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/key-bindings", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/misc", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "lib/spectrum", from:oh-my-zsh, ignore:oh-my-zsh.sh


zplug "plugins/cp", from:oh-my-zsh
zplug "plugins/common-aliases", from:oh-my-zsh
zplug "plugins/rvm", from:oh-my-zsh
zplug "plugins/docker", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/history", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/sudo", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/npm", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/sublime", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/terminitor", from:oh-my-zsh, ignore:oh-my-zsh.sh
zplug "plugins/web-search", from:oh-my-zsh, ignore:oh-my-zsh.sh

zplug "junegunn/fzf-bin", as:command, from:gh-r, rename-to:"fzf"
zplug "b4b4r07/enhancd", use:init.sh
zplug "supercrabtree/k"

# Theme
zplug "sindresorhus/pure", nice:1

# ===========================================================================
# Install plugins
# ===========================================================================

# Install plugins if they've not been installed
if ! zplug check --verbose; then
  printf "A new zplug version is available ! "
  printf "Would you like to install it ? [y/N]: "
  if read -q; then
    echo; zplug install
  fi
fi

# ===========================================================================
# Load plugins
# ===========================================================================

zplug load --verbose

# HACK(douglasduteil): enforcing zsh autosuggestions highlight color
# Strangely on my Terminator the autosuggestions highlight color stays white...
source $DOTFILES_DIR/zsh/zshenv.d/013-zsh-autosuggest.zsh

# ===========================================================================
#
# ===========================================================================
