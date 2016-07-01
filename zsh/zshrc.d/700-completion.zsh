##### Completion stuff
zstyle ':completion:::::' completer _complete _approximate

#_force_rehash() {
#  (( CURRENT == 1 )) && rehash
#  return 1     # Because we didn't really complete anything
#}
#zstyle ':completion:::::' completer _force_rehash _complete _approximate

zstyle -e ':completion:*:approximate:*' max-errors 'reply=( $(( ($#PREFIX + $#SUFFIX) / 3 )) )'
zstyle ':completion:*:descriptions' format "- %d -"
zstyle ':completion:*:corrections' format "- %d - (errors %e})"
zstyle ':completion:*:default' list-prompt '%S%M matches%s'
zstyle ':completion:*' group-name ''
zstyle ':completion:*:manuals' separate-sections true
zstyle ':completion:*:manuals.(^1*)' insert-sections true
zstyle ':completion:*' menu select
zstyle ':completion:*' verbose yes
##### End Completion stuff
