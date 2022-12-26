#!/bin/zsh

rustup default stable
rustup target add \
  wasm32-unknown-emscripten \
  wasm32-wasi \
  x86_64-unknown-linux-gnu \
