#!/bin/zsh

[[ -d "$CARGO_HOME" ]] || {
  echo "cargo missing on $CARGO_HOME"
  return
}

packages=(
  cargo-fmt
  racer
  rustfmt
  rustsym
)

echo "=> Install basic cargo packages"

cargo install "${packages[@]}"
