#!/bin/zsh

# [ -f "$HOME/.fzf.zsh" ] && source "$HOME/.fzf.zsh"
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
