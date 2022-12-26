#!/bin/zsh

echo "=> Get latest node version"

snm latest
snm use latest

echo "=> Set NPM to latest verions"

corepack enable
corepack prepare yarn@stable --activate
corepack prepare npm@latest --activate

# echo "=> Install global NPM packages"

# packages=(
#   chokidar-cli
#   gitmoji
#   typescript
# )

# npm install -g "${packages[@]}"
