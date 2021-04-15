#!/usr/bin/env bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    *)          machine="UNKNOWN:${unameOut}"
esac
echo "Running on ${machine} machine"

# Get current dir (so run this script from anywhere)

export DOTFILES_DIR
DOTFILES_DIR=~/.dotfiles
#DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Update e dotfiles itself first

[ -d "$DOTFILES_DIR/.git" ] && git --work-tree="$DOTFILES_DIR" --git-dir="$DOTFILES_DIR/.git" pull origin master

#
#
#

# Install nix
# https://nixos.org/download.html

# On linux
# curl -L https://nixos.org/nix/install | sh
# On mac
[[ ! $(which nix) && "${machine}" == "Mac" ]] && {
    sh <(curl -L https://nixos.org/nix/install) --daemon --darwin-use-unencrypted-nix-store-volume

}

# Go to nix :)
[[ $(which nix) ]] || {
  . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
}

nix --version

# Go unstable
# sudo nix-env -iA nixpkgs.nixUnstable

# nix --version
# nix-env -iA cachix -f https://cachix.org/api/v1/install

# Allow flakes
echo "experimental-features = nix-command flakes" | sudo tee -a /etc/nix/nix.
nix-shell -p nixUnstable --command "nix build --experimental-features 'nix-command flakes' --file $DOTFILES_DIR/nixpkgs"


nix-shell -p nix-info --run "nix-info -m"
# nix-env -i

echo "Restart the deamons"
launchctl unload -w /Library/LaunchDaemons/org.nixos.nix-daemon.plist
launchctl load -w /Library/LaunchDaemons/org.nixos.nix-daemon.plist


nix-shell -p nix-info --run "nix-info -m"

nix --version

#
#
#

# nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager
# nix-channel --update

# export NIX_PATH=$HOME/.nix-defexpr/channels${NIX_PATH:+:}$NIX_PATH

# Install home-manager
# https://github.com/nix-community/home-manager
# Inspired by https://hugoreeves.com/posts/2019/nix-home/
# nix-shell '<home-manager>' -A install

echo "Symlink $DOTFILES_DIR/config/nixpkgs/home.nix "
ln -sfv "$DOTFILES_DIR/config/nixpkgs/home.nix" "$HOME/.config/nixpkgs/home.nix"

echo "{ xnixPath = \"$(pwd)\"; operatingSystem = \"$(uname -v | awk '{ print $1 }' | sed 's/#.*-//')\"; }" > $HOME/.config/nixpkgs/machine.nix
home-manager switch


nix-shell -p nix-info --run "nix-info -m"

nix --version

# https://github.com/nix-community/home-manager#nix-flakes ?

# verify https://nixos.wiki/wiki/Flakes


# . "$DOTFILES_DIR/zsh/.zshenv"

# # Bunch of symlinks
# ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
# ln -sfv "$DOTFILES_DIR/git/.gitconfig" ~
# ln -sfv "$DOTFILES_DIR/git/.gitignore_global" ~
# mkdir -p `dirname $NPM_CONFIG_USERCONFIG`
# ln -sfv "$DOTFILES_DIR/npm/.npmrc" "$NPM_CONFIG_USERCONFIG"
# ln -sfv "$DOTFILES_DIR/zsh/.zprofile" ~
# ln -sfv "$DOTFILES_DIR/zsh/.zshenv" ~
# ln -sfv "$DOTFILES_DIR/zsh/.zshrc" ~

# # Package managers & packages
# . "$DOTFILES_DIR/install/zplug.sh"
# . "$DOTFILES_DIR/install/fzf.sh"
# . "$DOTFILES_DIR/install/nvm.sh"
# . "$DOTFILES_DIR/install/npm.sh"
# # . "$DOTFILES_DIR/install/rvm.sh"
# . "$DOTFILES_DIR/install/rustup.shh"
# . "$DOTFILES_DIR/install/cargo.sh"
# # . "$DOTFILES_DIR/install/ngrok.sh"
# . "$DOTFILES_DIR/install/yay.sh"
