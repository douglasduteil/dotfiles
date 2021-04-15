{
  description = "dougalsduteil home-manager";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  inputs.neovim-nightly-overlay.url = "github:nix-community/neovim-nightly-overlay";

  inputs.home-manager = {
    url = "github:nix-community/home-manager";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  inputs.LS_COLORS = {
    url = "github:trapd00r/LS_COLORS";
    flake = false;
  };

  outputs = { self, ... }@inputs:
    let
      overlays = [
        (final: prev: { LS_COLORS = inputs.LS_COLORS; })
      ];
    in
    {
      configuration = { pkgs, config, ... }:
        {
          xdg.configFile."nix/nix.conf".source = ./configs/nix/nix.conf;
          nixpkgs.config = import ./configs/nix/config.nix;
        };
    };
}
