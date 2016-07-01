#!/bin/zsh

source ~/.dotfiles/zsh/zshenv.d/002-nvm.zsh

[[ -d $NVM_DIR ]] || {
  git clone https://github.com/creationix/nvm.git $NVM_DIR && cd $NVM_DIR&& git checkout `git describe --abbrev=0 --tags`
}
