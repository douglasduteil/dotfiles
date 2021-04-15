cd "${DOTFILES_DIR}/nixpkgs"
nix flake update
git add "${DOTFILES_DIR}/nixpkgs"
git commit -m "chore(nix): nix flake update $(date +"%D %T")"
git push origin master
cd -
