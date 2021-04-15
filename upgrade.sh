cd $DOTFILES_DIR
nix flake update
git add $DOTFILES_DIR
git commit -m "$(date +"%D %T")"
git push origin master
cd -
