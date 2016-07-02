#!/bin/zsh

[[ -d $NVM_DIR ]] || {
  echo ""
  echo "=> Installing nvm in $NVM_DIR"
  git clone --depth 1 https://github.com/creationix/nvm.git $NVM_DIR
  cd $NVM_DIR && git checkout `git describe --abbrev=0 --tags`
}
