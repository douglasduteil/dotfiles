#!/bin/bash

[[ -d $YAY_HOME ]] || {
  echo ""
  echo "=> Installing yay in $YAY_HOME"
  git clone --depth 1  https://aur.archlinux.org/yay.git $YAY_HOME
  cd $YAY_HOME
  makepkg -si
  cd -
}
