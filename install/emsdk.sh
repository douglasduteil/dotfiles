#!/bin/zsh

[[ -d $EMSDK_HOME ]] && {
  echo "=> emsdk is already installed in $EMSDK_HOME, trying to update"
  echo -ne "\r=> "
  emsdk update
} || {
  echo
  echo "=> Installing emsdk in $EMSDK_HOME"
  curl https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz | tar xvz -C $XDG_PROGRAMS_DIR
  cd $EMSDK_HOME
  sed -i.bak '1 s/python/python2/' emsdk
  # HACK: silent first intall trial
  # The installation often fail due to connection problem...
  ./emsdk install latest > /dev/null
  # Run it again to ensure that the installation is successful :)
  ./emsdk install latest
  ./emsdk activate latest
  echo
}
