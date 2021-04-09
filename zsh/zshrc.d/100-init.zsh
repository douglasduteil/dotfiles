#!/bin/zsh

# ===========================================================================
# Init
# ===========================================================================

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH:$XDG_BIN_DIR:$XDG_LOCAL_DIR/bin"

### Ensure that GPG knows the current tty output
GPG_TTY=$(tty)
export GPG_TTY

### Export the correct DBUS_SESSION_BUS_ADDRESS and DBUS_SESSION_BUS_PID
## see https://github.com/Microsoft/WSL/issues/2016#issuecomment-435091497

export $(dbus-launch)

### Ensure that the DISPLAY match the IP of the X server on Windows
## see https://blog.eleven-labs.com/fr/le-developpement-sous-linux-depuis-windows-10-avec-wsl-2/
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2; exit;}'):0.0

# ===========================================================================
#
# ===========================================================================
