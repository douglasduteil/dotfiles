# =================================================================
# zsh-autosuggestions config
# =================================================================

zstyle ':completion:*' rehash true

zstyle ':completion:*' menu select
zstyle ':completion:*' completer _complete _expand _ignored _approximate
zstyle ':completion:*' matcher-list '' 'm:{[:lower:][:upper:]}={[:upper:][:lower:]}' '+l:|=* r:|=*'
zstyle ':completion:*' group-name '' # group results by category

export ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=5"

# =================================================================
#
# =================================================================
