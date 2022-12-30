#!/bin/zsh

# ===========================================================================
# Zinit
# ===========================================================================

# First-time run: need to download zinit if it doesn't exist
[[ -f $ZINIT_HOME/zinit.zsh ]] || {
  echo "Zinit missing in $ZINIT_HOME"
  return
}

### Oh My Zsh Libraries

zinit wait lucid for \
  OMZL::compfix.zsh \
  OMZL::completion.zsh \
  OMZL::correction.zsh \
  OMZL::directories.zsh \
  OMZL::functions.zsh \
  OMZL::grep.zsh \
  OMZL::history.zsh \
  OMZL::key-bindings.zsh \
  OMZL::spectrum.zsh \
  OMZL::termsupport.zsh \
  # OMZL::misc.zsh \

### Oh My Zsh Plugins

zinit wait lucid for \
  OMZP::colored-man-pages \
  OMZP::command-not-found \
  OMZP::docker \
  OMZP::docker-compose \
  OMZP::dirhistory \
  OMZP::man \
  OMZP::history \
  OMZP::fancy-ctrl-z \
  OMZP::web-search \

# :: https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/git
zinit wait lucid for \
  OMZL::git.zsh \
    atload"unalias grv" \
  OMZP::git \

### Programs

# :: https://github.com/zdharma-continuum/fast-syntax-highlighting
zinit wait lucid \
  atinit"ZINIT[COMPINIT_OPTS]=-C; zicompinit; zicdreplay;" \
for @zdharma-continuum/fast-syntax-highlighting

# :: https://github.com/zsh-users/zsh-autosuggestions
zinit wait lucid \
  atload"
    _zsh_autosuggest_start;
    bindkey '^_' autosuggest-execute;
    bindkey '^]' autosuggest-accept;
    ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=10'
  " \
for @zsh-users/zsh-autosuggestions

# :: https://github.com/zsh-users/zsh-history-substring-search
zinit wait lucid \
  atload"
    export HISTORY_SUBSTRING_SEARCH_HIGHLIGHT_FOUND='bg=yellow,fg=white,bold'
    bindkey '^[[A' history-substring-search-up
    bindkey '^[[B' history-substring-search-down
  " \
for @zsh-users/zsh-history-substring-search
### Completion

### :: https://github.com/zsh-users/zsh-completions
zinit wait lucid \
  blockf atpull'zinit creinstall -q .' \
for @zsh-users/zsh-completions

## :: https://github.com/rust-lang/rustup
zinit wait lucid light-mode nocompile run-atpull \
  as"completion" \
  atclone"rustup completions zsh > _rustup && rustup completions zsh cargo > _cargo" \
  atload"zicompinit; zicdreplay" \
  atpull="%atclone" \
  has"rustup" \
  id-as="rust-lang/rustup" \
for @zdharma-continuum/null

## :: https://github.com/numToStr/snm
zinit wait lucid light-mode nocompile run-atpull \
  as"completion" \
  atclone"snm completions zsh > _snm" \
  atpull="%atclone" \
  has"snm" \
  atload'eval "$(snm env zsh)"; alias n="snm"; zicompinit; zicdreplay' \
  id-as="numToStr/snm" \
for @zdharma-continuum/null

## :: https://github.com/lotabout/skim
# zinit wait lucid light-mode nocompile run-atpull \
#   as"program" \
#   multisrc"shell/{completion,key-bindings}.zsh" \
# for @lotabout/skim

## :: https://github.com/ogham/exa
zinit wait lucid light-mode nocompile \
  as"completion" \
  has"exa" \
  atclone"fd -d1 -E 'completions' --exec rm -rf {}" \
  multisrc"shell/completions/zsh/_exa" \
  atload"zicompinit; zicdreplay" \
  pick"/dev/null" \
for @ogham/exa
zinit wait lucid light-mode nocompile \
  as"snippet" \
for @DarrinTisdale/zsh-aliases-exa

### VSCode integration
zinit wait is-snippet lucid \
  has="code" if='[[ "$TERM_PROGRAM" == "vscode" ]]' for \
  "$(code --locate-shell-integration-path zsh)" \

### fzf

### https://github.com/zdharma-continuum/zinit-packages/tree/main/fzf
zinit pack"binary" for fzf

### https://github.com/joshskidmore/zsh-fzf-history-search
### https://github.com/paulirish/git-open
### https://github.com/Aloxaf/fzf-tab
zinit wait lucid light-mode for \
  paulirish/git-open \
  joshskidmore/zsh-fzf-history-search \

### Prompt

PS1="🦎" # provide a simple prompt till the theme loads
zinit wait lucid light-mode  \
  as"program" \
  atclone"./starship init zsh > init.zsh; ./starship completions zsh > _starship" \
  atpull"%atclone" \
  from"gh-r" \
  src"init.zsh" \
for @starship/starship

# ===========================================================================
#
# ===========================================================================
