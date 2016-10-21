#!/bin/zsh

[[ -d $NVM_DIR ]] || {
  echo "nvm missing on $NVM_DIR"
  return
}

echo ""
echo "=> Set NVM to latest node version"
. "$NVM_DIR/nvm.sh"

nvm install stable
nvm use stable
nvm alias default stable

echo "=> Set NPM to latest verions"

npm i -g npm

echo "=> Install global NPM packages"

packages=(
  chokidar-cli
  devtool
  flow-bin
  greenkeeper
  mocha
  npm-check
)

npm install -g "${packages[@]}"
