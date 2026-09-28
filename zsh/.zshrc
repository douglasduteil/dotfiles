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

# oh-my-zsh.sh normally sets ZSH_CACHE_DIR and creates its completions
# subdir; this zshrc assembles OMZ from its libs and plugins directly, so
# it never runs. The docker plugin copies its completion file into
# $ZSH_CACHE_DIR/completions on every startup -- with the variable unset
# the cp target collapses to /completions and errors on each shell start.
ZSH_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/oh-my-zsh"
mkdir -p "$ZSH_CACHE_DIR/completions"
# The plugin cp's its completion into this dir on every startup. The
# source lives in the read-only nix store, so a plain cp leaves the
# cache file mode 444 and the next startup's cp fails with permission
# denied. Pre-create it writable once; cp then only rewrites content.
_docker_cache="$ZSH_CACHE_DIR/completions/_docker"
[[ -e "$_docker_cache" ]] || install -m 644 /dev/null "$_docker_cache"
[[ -w "$_docker_cache" ]] || chmod u+w "$_docker_cache"

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
# up/down arrow bound by atuin instead, see below

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
# zoxide
# ===========================================================================

# :: https://github.com/ajeetdsouza/zoxide
eval "$(zoxide init zsh)"

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
# Atuin
# ===========================================================================

# :: https://github.com/atuinsh/atuin
# must load after starship -- starship's zsh init resets precmd_functions/
# preexec_functions rather than appending, silently dropping atuin's hook
# if atuin loads first (commands stop recording live, no error).
eval "$(atuin init zsh)"

# ===========================================================================
# omp completions
# ===========================================================================

# :: https://github.com/can1357/oh-my-pi
eval "$(omp completions zsh)"

# ===========================================================================
#
# ===========================================================================
