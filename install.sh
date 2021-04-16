#!/usr/bin/env bash


# A variable as a starting point of zplug
DOTFILES_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

. "$DOTFILES_ROOT/zsh/.zshenv"

if [[ $(uname -s) == 'Darwin' ]]; then
  sh <(curl -L https://nixos.org/nix/install) \
    --daemon \
    --darwin-use-unencrypted-nix-store-volume
else
  sh <(curl -L https://nixos.org/nix/install) --daemon
fi

echo "sdf"
