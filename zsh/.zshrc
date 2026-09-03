#!/bin/zsh

OMZ_LIB="$HOME/.nix-profile/share/oh-my-zsh/lib"
OMZ_PLUGINS="$HOME/.nix-profile/share/oh-my-zsh/plugins"

# ===========================================================================
# Completion providers (fpath) -- MUST come before compinit below
# ===========================================================================
#
# Anything that ships `_*` completion files needs its directory added to
# fpath here, before `compinit` runs. compinit only scans fpath once, at
# the point it's called in this file -- entries added lower down are
# invisible to it, silently (no error, the completion just never works).
# This is otherwise unrelated docker/docker-compose (OMZP) + zsh-completions,
# grouped here only because of this ordering constraint, not because they're
# the same kind of thing.

fpath+=("$OMZ_PLUGINS/docker/completions")
fpath+=("$OMZ_PLUGINS/docker-compose")

# :: https://github.com/zsh-users/zsh-completions
fpath+=("$HOME/.nix-profile/share/zsh/site-functions")

autoload -Uz compinit && compinit

# ===========================================================================
# Oh My Zsh libs
# ===========================================================================

for lib in compfix completion correction directories functions grep history key-bindings spectrum termsupport misc; do
  source "$OMZ_LIB/$lib.zsh"
done

# ===========================================================================
# Oh My Zsh plugins
# ===========================================================================

for plugin in colored-man-pages command-not-found docker docker-compose dirhistory man history fancy-ctrl-z web-search; do
  source "$OMZ_PLUGINS/$plugin/$plugin.plugin.zsh"
done

# :: https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/git
source "$OMZ_LIB/git.zsh"
source "$OMZ_PLUGINS/git/git.plugin.zsh"
unalias grv

# ===========================================================================
# Syntax highlighting
# ===========================================================================

# :: https://github.com/z-shell/F-Sy-H
source "$HOME/.nix-profile/share/zsh/plugins/fast-syntax-highlighting/fast-syntax-highlighting.plugin.zsh"

# ===========================================================================
# Autosuggestions
# ===========================================================================

# :: https://github.com/zsh-users/zsh-autosuggestions
source "$HOME/.nix-profile/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
_zsh_autosuggest_start
bindkey '^_' autosuggest-execute
bindkey '^]' autosuggest-accept
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=10'

# ===========================================================================
# History substring search
# ===========================================================================

# :: https://github.com/zsh-users/zsh-history-substring-search
source "$HOME/.nix-profile/share/zsh-history-substring-search/zsh-history-substring-search.zsh"
export HISTORY_SUBSTRING_SEARCH_HIGHLIGHT_FOUND='bg=yellow,fg=white,bold'
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down

# ===========================================================================
# fzf
# ===========================================================================

# :: https://github.com/junegunn/fzf
FD_OPTIONS="--hidden --follow"
export FZF_DEFAULT_OPTS="--prompt '🦎 ' --marker=+ --color=dark --layout=reverse --color=fg:250,fg+:15,hl:203,hl+:203 --color=info:100,pointer:15,marker:220,spinner:11,header:-1,gutter:-1,prompt:15"
export FZF_DEFAULT_COMMAND="fd --type f --type l $FD_OPTIONS || git ls-files --cached --others --exclude-standard"
export FZF_CTRL_T_COMMAND="fd $FD_OPTIONS"
export FZF_ALT_C_COMMAND="fd --type d $FD_OPTIONS"
export FZF_COMPLETION_OPTS="-x"

_fzf_compgen_path() {
  fd --hidden --follow . "$1"
}
_fzf_compgen_dir() {
  fd --type d --hidden --follow . "$1"
}

source <(fzf --zsh)

# :: https://github.com/joshskidmore/zsh-fzf-history-search
source "$HOME/.nix-profile/share/zsh-fzf-history-search/zsh-fzf-history-search.zsh"

# ===========================================================================
# SSH
# ===========================================================================

# The session sets SSH_ASKPASS to a KDE ksshaskpass binary that hangs with no
# visible window in this WSL setup (fails to register with the desktop
# portal) instead of falling back to a terminal prompt. Force ssh to always
# prompt on the terminal -- needed for FIDO2 PIN entry on every signing/auth
# operation.
export SSH_ASKPASS_REQUIRE=never

# ===========================================================================
# Prompt
# ===========================================================================

# :: https://github.com/starship/starship
# already installed via packages/flake.nix -- no zinit gh-r fetch needed, and
# no async placeholder prompt needed since loading here is synchronous
eval "$(starship init zsh)"

# ===========================================================================
#
# ===========================================================================
