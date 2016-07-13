#!/bin/zsh

[[ -d $rvm_path ]] || {
  echo ""
  echo "=> Installing rvm in $rvm_path"
  gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 || command curl -sSL https://rvm.io/mpapis.asc | gpg --import -
  curl -L https://get.rvm.io | \
  bash -s -- stable --path $rvm_path --ignore-dotfiles --ruby
}
