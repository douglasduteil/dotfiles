{ pkgs, ... }:

{
  imports = import ../../modules;

  programs.fish.enable = true;
  programs.starship.enable = true;
  programs.kitty.enable = true;

  home.packages = with pkgs; [
    nixpkgs-fmt
    jq
    yq
    fzf
    ripgrep
    bfg-repo-cleaner
    vault
    stern
    chromedriver
    dhall-lsp-server
    dhall
  ];

  home.sessionVariables = {
    EDITOR = "code";
  };
}
