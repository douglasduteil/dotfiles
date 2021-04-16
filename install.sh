#!/usr/bin/env bash

# A variable as a starting point of zplug
DOTFILES_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

. "$DOTFILES_ROOT/zsh/.zshenv"

if [[ "$(which nix)" != *.nix-profile/bin/nix ]]; then
  echo "O_o" >&2
  echo "Remove the $(which nix)" >&2
  exit 42
fi

if ! type "nix" &> /dev/null; then
  if [[ $(uname -s) == 'Darwin' ]]; then
    sh <(curl -L https://nixos.org/nix/install) \
      --daemon \
      --nix-extra-conf-file $DOTFILES_ROOT/config/nix/nix.conf \
      --darwin-use-unencrypted-nix-store-volume
  else
    sh <(curl -L https://nixos.org/nix/install) --daemon
  fi
fi

nix --version
nix-shell -p nix-info --run "nix-info -m"
SYSTEM=''$(nix eval --raw nixpkgs#pkgs.system)
FLAKE="$DOTFILES_ROOT/nixpkgs#homeConfigurations.$USER.activationPackage"

echo "nix build --no-update-lock-file $FLAKE"
nix build --no-update-lock-file $FLAKE
