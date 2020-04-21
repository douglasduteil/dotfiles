#!/bin/zsh

# One command to update all the system

system_update() {

  _ pacman -Suy
  yay -Sau

  _ pacman -Rns $(_ pacman -Qqdt)

  #

  nvm upgrade
  nvm install 'lts/*' --latest-npm --reinstall-packages-from='lts/*'
  nvm install node --latest-npm --reinstall-packages-from=node

  #

  local lts_version=$(nvm list lts/* --no-colors | sed 's/[> *-]*//g')
  local stable_version=$(nvm list stable --no-colors | sed 's/[> *-]*//g')

  nvm ls --no-colors \
    | grep -vF system \
    | grep -vF $lts_version \
    | grep -vF $stable_version \
    | grep -E "^[[:space:]].*[*]$" \
    | sed 's/[v> *-]*//g' \
    | xargs -L 1 -I {} sh -c "source $NVM_DIR/nvm.sh && nvm uninstall {}"
    ;
}
