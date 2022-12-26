#!/bin/zsh

[[ -d "$CARGO_HOME" ]] || {
  echo "cargo missing on $CARGO_HOME"
  return
}

packages=(
  cargo-watch
)

echo "=> Install basic cargo packages"

for package in $packages
do
  echo "==> run 'cargo install $package'";
  cargo install $package &;
done

wait

echo "=> Cargo packages installed"
