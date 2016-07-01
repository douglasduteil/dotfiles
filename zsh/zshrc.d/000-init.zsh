# Add path for custom completion scripts
fpath=(~/.config/local/zsh/completion $fpath)

setopt completealiases
autoload -U compaudit compinit

# Load complist
zmodload zsh/complist

# Vi mode
bindkey -v

# =================================================================

# ===================SET OPTIONS ==================================

# No need to type 'cd' for a directory as long as directory exists
setopt AUTO_CD
setopt NO_HUP
setopt NO_CHECK_JOBS

# Set history options
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_REDUCE_BLANKS
setopt HIST_NO_FUNCTIONS

# Set colors and prompt
setopt prompt_subst
autoload -U promptinit && promptinit
autoload -U colors && colors # Enable colors in prompt


# =================================================================

# =================================================================
