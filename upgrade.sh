#!/usr/bin/env bash

DOTFILES_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [[ $(uname -s) == 'Darwin' ]]; then
  sudo -i zsh -c '
    nix-channel --update &&
    nix-env -iA nixpkgs.nix &&
    launchctl remove org.nixos.nix-daemon &&
    launchctl load /Library/LaunchDaemons/org.nixos.nix-daemon.plist
  '
else
  nix-channel --update
  nix-env -iA nixpkgs.nix nixpkgs.cacert
  systemctl daemon-reload
  systemctl restart nix-daemon
fi

cd "${DOTFILES_ROOT}/nixpkgs"

nix flake update
git add "${DOTFILES_ROOT}/nixpkgs"
git commit -m "chore(nix): nix flake update $(date +"%D %T")"
git push origin master
cd -
