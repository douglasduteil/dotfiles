#!/bin/zsh

# ===========================================================================
# ZSH zplug
# ===========================================================================
autoload -U colors && colors
export LSCOLORS="Gxfxcxdxbxegedabagacad"

# Enable ls colors
if [ "$DISABLE_LS_COLORS" != "true" ]
then
  # Find the option for using colors in ls, depending on the version: Linux or BSD
  if [[ "$(uname -s)" == "NetBSD" ]]; then
    # On NetBSD, test if "gls" (GNU ls) is installed (this one supports colors);
    # otherwise, leave ls as is, because NetBSD's ls doesn't support -G
    gls --color -d . &>/dev/null 2>&1 && alias ls='gls --color=tty'
  elif [[ "$(uname -s)" == "OpenBSD" ]]; then
    # On OpenBSD, "gls" (ls from GNU coreutils) and "colorls" (ls from base,
    # with color and multibyte support) are available from ports.  "colorls"
    # will be installed on purpose and can't be pulled in by installing
    # coreutils, so prefer it to "gls".
    gls --color -d . &>/dev/null 2>&1 && alias ls='gls --color=tty'
    colorls -G -d . &>/dev/null 2>&1 && alias ls='colorls -G'
  else
    ls --color -d . &>/dev/null 2>&1 && alias ls='ls --color=tty' || alias ls='ls -G'
  fi
fi

setopt auto_cd
setopt multios

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
