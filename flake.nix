{
  description = "dougalsduteil home-manager";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
    neovim-nightly-overlay.url = "github:nix-community/neovim-nightly-overlay";
  };

  inputs.LS_COLORS = {
    url = "github:trapd00r/LS_COLORS";
    flake = false;
  };

  outputs = { self, home-manager, ... }@inputs:
    {
      homeConfigurations = {
        macbook-pro = inputs.home-manager.lib.homeManagerConfiguration {
          configuration = { pkgs, ... }:
            {
              xdg.configFile."nix/nix.conf".source = ./configs/nix/nix.conf;
              nixpkgs.config = import ./configs/nix/config.nix;
              imports = [
                ./home.nix
                ./home-manager-modules/home-manager
                ./home-manager-modules/nixos-bash
                ./home-manager-modules/vim
              ];

            };
          system = "x86_64-darwin";
          homeDirectory = "/Users/x";
          username = "x";
        };
      };
      macbook-pro = self.homeConfigurations.macbook-pro.activationPackage;
    };

}
