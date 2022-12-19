#!/bin/bash

[[ -d $YAY_HOME ]] || {
  echo ""
  echo "=> pacman -S --needed git base-devel"
  pacman -S --needed git base-devel
  echo "=> Installing yay in $YAY_HOME"
  git clone --depth 1 https://aur.archlinux.org/yay-bin.git $YAY_HOME
  cd $YAY_HOME
  makepkg -si
  cd -
}

echo "$ yay --sync \
--batchinstall \
--cleanafter \
--needed \
--noconfirm \
--overwrite '*'\
  $(cat "$DOTFILES_DIR/install/yay.txt" | tr '\n' ' ')"

yay --sync \
  --batchinstall \
  --cleanafter \
  --needed \
  --noconfirm \
  --overwrite '*'\
  $(cat "$DOTFILES_DIR/install/yay.txt" | tr '\n' ' ')
