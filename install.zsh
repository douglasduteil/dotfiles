#!/bin/zsh

#
# Use siblings `install.sh` if no zsh founc
#

if ! type "zsh" &> /dev/null || ! type "nix" &> /dev/null; then
  echo "O_o" >&2
  echo "Use siblings 'install.sh' to install them" >&2

  exit 42
fi

#
# Use siblings `install.sh` if no zsh founc
#

if [[ "$(which zsh)" != *.nix-profile/bin/zsh ]]; then
  echo "O_o" >&2
  echo "zsh is not from .nix-profile" >&2

  exit 42
fi

# A variable as a starting point of zplug
typeset -gx DOTFILES_ROOT="${${(%):-%N}:A:h}"


. "$DOTFILES_ROOT/zsh/.zshenv"
