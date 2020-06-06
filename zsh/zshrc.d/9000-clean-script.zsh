#!/bin/zsh

# all cache clean up alias

clear-cache() {

  rmm () {
    rm -rfv "$@"
  }

  echo "* Remove Yay cache"
  yay -Sc

  echo "* Remove Pacman cache"
  pacman -Sc

  echo "* Removing Docker stuff"
  docker system prune

  echo "* Removing nvm cache"
  nvm cache clear

  echo "* Removing yarn cache"
  yarn cache clean

  echo "* Removing npm cache"
  npm cache clean --force

  echo "* Removing Opera Developer cache"
  rmm "~/.config/opera-developer/File System/*"
  rmm "~/.config/opera-developer/Service Worker/CacheStorage/*"
  rmm "~/.config/opera-developer/Service Worker/ScriptCache/*"
  rmm "~/.config/opera-developer/GPUCache/*"

  echo "* Removing Chromium cache"
  rmm "~/.config/chromium/*/Application Cache/*"
  rmm "~/.config/chromium/*/Cache/*"
  rmm "~/.config/chromium/*/Code Cache/*"
  rmm "~/.config/chromium/*/File System/*"
  rmm "~/.config/chromium/*/GPUCache/*"
  rmm "~/.config/chromium/*/Media Cache/*"
  rmm "~/.config/chromium/*/Service Worker/CacheStorage/*"
  rmm "~/.config/chromium/*/Service Worker/ScriptCache/*"

  echo "* Removing all github node_modules"
  rmm "~/zzz/github/*/*/node_modules"

  echo "* Removing ~/tmp/* node_modules"
  rmm "~/tmp/*/node_modules"

  echo "* Removing ~/.local/share/Trash node_modules"
  rmm "~/.local/share/Trash/files/*"
  rmm "~/.local/share/Trash/info/*"

  echo "* Removing ~/.Trash node_modules"
  rmm "~/.Trash"

  echo "* Removing ~/.cache/bazel"
  rmm "~/.cache/bazel"

  echo "* Removing ~/.cache/Cypress"
  rmm "~/.cache/Cypress"

  echo "* Removing ~/.cache/typescript"
  rmm "~/.cache/typescript"

  echo "* Removing google-chrome-beta cache"
  rmm "~/.cache/google-chrome-beta/(Default|Profile*)/File System/*"

  echo "=== All Cache/Tmp Deleted ==="
}
