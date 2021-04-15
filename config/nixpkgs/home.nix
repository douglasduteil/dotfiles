{ config, pkgs, ... }:

let
  homeDir = builtins.getEnv "HOME";
  machine = import "${homeDir}/.config/nixpkgs/machine.nix";
  isMacOS = machine.operatingSystem == "Darwin";
in {
  # Let Home Manager install and manage itself.
  programs.home-manager.enable = true;
  programs.bat.enable = true;

  home.username = "x";
  home.homeDirectory =
    if isMacOS then "/Users/x" else "/home/x";
  # home.homeDirectory = "/Users/x";

  home.stateVersion = "21.05";
  home.packages = with pkgs;
    [
      bat
      curl
      gcc
      git
      nodejs
      wget
      youtube-dl
    ];
}
