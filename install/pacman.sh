#!/bin/zsh

echo "$ sudo pacman --noconfirm -S $(cat "$DOTFILES_DIR/install/pacman.txt" | tr '\n' ' ')"
sudo pacman --noconfirm -S $(cat "$DOTFILES_DIR/install/pacman.txt" | tr '\n' ' ')
