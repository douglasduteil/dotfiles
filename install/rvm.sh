#!/bin/zsh

[[ -d $rvm_path ]] || {
  echo ""
  echo "=> Installing rvm in $rvm_path"
  gpg2 --keyserver hkp://pool.sks-keyservers.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB || command curl -sSL https://rvm.io/mpapis.asc | gpg --import -
  curl -L https://get.rvm.io | \
  bash -s -- stable --path $rvm_path --ignore-dotfiles --ruby
}
