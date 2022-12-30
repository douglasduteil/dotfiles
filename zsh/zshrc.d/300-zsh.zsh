#!/bin/zsh

# ===========================================================================
# ZSH
# ===========================================================================

setopt auto_cd
setopt multios

[[ -z "$HISTFILE" ]] && HISTFILE="$HOME/.zsh_history"
export HISTSIZE=1000000   # the number of items for the internal history list
export SAVEHIST=$HISTSIZE   # maximum number of items for the history file

# The meaning of these options can be found in man page of `zshoptions`.
setopt extended_history       # record timestamp of command in HISTFILE
setopt hist_expire_dups_first # delete duplicates first when HISTFILE size exceeds HISTSIZE
setopt hist_ignore_all_dups   # ignore duplicated commands history list
setopt hist_ignore_space      # ignore commands that start with space
setopt hist_verify            # show command with history expansion to user before running it
setopt inc_append_history     # add commands to HISTFILE in order of execution
setopt share_history          # share command history data
setopt always_to_end          # cursor moved to the end in full completion
setopt hash_list_all          # hash everything before completion
setopt completealiases        # complete alisases
setopt always_to_end          # when completing from the middle of a word, move the cursor to the end of the word
setopt complete_in_word       # allow completion from within a word/phrase
setopt nocorrect              # spelling correction for commands
setopt list_ambiguous         # complete as much of a completion until it gets ambiguous.

# zmv allow smart file renaming
autoload -U zmv

# add node-inspect : the "node --inspect --debug-brk" alias
alias node-inspect='node --inspect --debug-brk'

# Move trailling ~/.wget-hsts file to
# see https://stackoverflow.com/questions/47548271/disable-wget-history-tracking
alias wget="wget --hsts-file ${XDG_CONFIG_DIR}/wget/wget-hsts"

alias regctl='docker container run -it --rm --net host \
  -u "$(id -u):$(id -g)" -e HOME -v $HOME:$HOME \
  -v /etc/docker/certs.d:/etc/docker/certs.d:ro \
  regclient/regctl:latest'

# ===========================================================================
#
# ===========================================================================
