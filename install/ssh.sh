#!/bin/zsh

# ===========================================================================
# Github ssh keygen
# ===========================================================================

ssh-keygen \
  -f $HOME/.ssh/github \
  -t ed25519 \
  -C "douglasduteil@gmail.com"

ssh-add $HOME/.ssh/github
