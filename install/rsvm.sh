#!/bin/zsh

[[ -d $RSVM_DIR ]] && {
  echo "=> RSVM is already installed in $RSVM_DIR, trying to update"
  echo -ne "\r=> "
  cd $RSVM_DIR && git pull
} || {
  echo
  echo "=> Installing rsvm in $RSVM_DIR"
  git clone --depth 1 https://github.com/sdepold/rsvm.git $RSVM_DIR
  echo
}
