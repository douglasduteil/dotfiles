#!/bin/zsh

# all cache clean up alias

clear-cache() {

  rmm () {
    rm -rv $1 | pv -l -s $( du -a $1 | wc -c ) > /dev/null
  }

  echo "Remove Pacman and Pacaur cache"
  pacaur -Sc

  echo "Removing Docker stuff"
  docker system prune

  echo "Removing nvm cache"
  nvm cache clear

  echo "Removing yarn cache"
  yarn cache clean

  echo "Removing npm cache"
  npm cache clean --force

  echo "Removing Opera Developer cache"
  rmm ~/.config/opera-developer/File\ System/*

  echo "Removing Chromium cache"
  rmm ~/.config/chromium/(Default|Profile*)/File\ System/*

  echo "Removing all github node_modules"
  rmm ~/zzz/github/*/*/node_modules

  echo "Removing ~/tmp/* node_modules"
  rmm ~/tmp/*/node_modules

  echo "Removing ~/.local/share/Trash node_modules"
  rmm ~/.local/share/Trash/files/*
  rmm ~/.local/share/Trash/info/*

  echo "Removing ~/.Trash node_modules"
  rmm ~/.Trash

  echo "Removing ~/.cache/bazel"
  rmm ~/.cache/bazel

  echo "Removing ~/.cache/Cypress"
  rmm ~/.cache/Cypress

  echo "Removing ~/.cache/typescript"
  rmm ~/.cache/typescript

  echo "Removing google-chrome-beta cache"
  rmm ~/.cache/google-chrome-beta/(Default|Profile*)/File\ System/*

  echo "Removing ~/.cache/chromium/*/?(Media\ )Cache/*"
  rmm ~/.cache/chromium/*/?(Media\ )Cache/*

  echo "=== All Cache/Tmp Deleted ==="
}
