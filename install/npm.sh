#

nvm install stable
nvm use stable
nvm alias default stable

# Globally install with npm

packages=(
  chokidar-cli
  devtool
  flow-bin
  mocha
  updtr
)

npm install -g "${packages[@]}"
