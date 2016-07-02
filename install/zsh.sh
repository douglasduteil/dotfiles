#!/bin/bash

[[ -f /bin/zsh ]] || {
  echo ""
  echo "=> Installing zsh in /bin/zsh"
  sudo apt-get install zsh
  chsh -s /bin/zsh
}
