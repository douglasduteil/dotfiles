#!/bin/zsh

[[ -d $RUSTUP_HOME ]] && {
  echo "=> rustup is already installed in $RUSTUP_HOME, trying to update"
  echo -ne "\r=> "
  rustup self update
  rustup update
} || {
  echo
  echo "=> Installing rustup in $RUSTUP_HOME"
  curl https://sh.rustup.rs -sSf | sh -s -- --no-modify-path
  mkdir -p $HOME/.zfunc
  rustup completions zsh > $HOME/.zfunc/_rustup
  rustup default stable
  rustup target add wasm32-unknown-emscripten
  echo
}
