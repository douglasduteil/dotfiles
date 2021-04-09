#!/bin/zsh

# ===========================================================================
# Init zplug
# ===========================================================================

# First-time run: need to download zplug if it doesn't exist
[[ -f $ZPLUG_HOME/init.zsh ]] || {
  echo "zplug missing in $ZPLUG_HOME"
  return
}

# ===========================================================================
# Plugins
# ===========================================================================

# Essential
source $ZPLUG_HOME/init.zsh

zplug "zplug/zplug", hook-build:'zplug --self-manage'

# Plugins
zplug "zsh-users/zsh-syntax-highlighting", defer:2
zplug "zsh-users/zsh-autosuggestions", defer:2
zplug "zsh-users/zsh-history-substring-search"
zplug "zsh-users/zsh-completions"

# Required by pure
zplug "mafredri/zsh-async", on:sindresorhus/pure
# Allow async nvm start
zplug "lukechilds/zsh-nvm"

# Oh my zsh libs

# Disabling "lib/completion" due to error on latest update :
# clipcopy: Platform linux-gnu not supported or xclip/xsel not installed
# zplug "lib/clipboard", from:oh-my-zsh

zplug "lib/completion", from:oh-my-zsh
zplug "lib/correction", from:oh-my-zsh
zplug "lib/directories", from:oh-my-zsh
zplug "lib/grep", from:oh-my-zsh
zplug "lib/history", from:oh-my-zsh
zplug "lib/key-bindings", from:oh-my-zsh
zplug "lib/misc", from:oh-my-zsh
zplug "lib/spectrum", from:oh-my-zsh

zplug "junegunn/fzf-bin", as:command, from:gh-r, rename-to:"fzf"
zplug "b4b4r07/enhancd", use:init.sh
zplug "supercrabtree/k"

# Theme
zplug "sindresorhus/pure", defer:3


# Install plugins if there are plugins that have not been installed
if ! zplug check --verbose; then
    printf "Install? [y/N]: "
    if read -q; then
        echo; zplug install
    fi
fi

# ===========================================================================
# Load plugins
# ===========================================================================

zplug load # --verbose

# ===========================================================================
#
# ===========================================================================


# HACK(douglasduteil): enforcing zsh autosuggestions highlight color
# Strangely on my Terminator the autosuggestions highlight color stays white...
source $DOTFILES_DIR/zsh/zshenv.d/013-zsh-autosuggest.zsh
