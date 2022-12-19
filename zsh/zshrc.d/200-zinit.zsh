#!/bin/zsh

# ===========================================================================
# Zinit
# ===========================================================================

[[ -f "$ZINIT_HOME/zinit.zsh" ]] || {
  echo "Zinit missing in $ZINIT_HOME"
  return
}

source "$ZINIT_HOME/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit

# Load a few important annexes, without Turbo
# (this is currently required for annexes)
zinit light-mode for \
  zdharma-continuum/zinit-annex-as-monitor \
  zdharma-continuum/zinit-annex-bin-gem-node \
  zdharma-continuum/zinit-annex-meta-plugins \
  zdharma-continuum/zinit-annex-patch-dl \
  zdharma-continuum/zinit-annex-rust \

# ===========================================================================
#
# ===========================================================================
