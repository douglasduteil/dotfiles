{
  description = "dougalsduteil home-manager";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

    flake-utils.url = "github:numtide/flake-utils";
    flake-utils.inputs.nixpkgs.follows = "nixpkgs";

    darwin.url = "github:lnl7/nix-darwin";
    darwin.inputs.nixpkgs.follows = "nixpkgs";

    home-manager.url = "github:nix-community/home-manager/master";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, darwin, nixpkgs, home-manager, flake-utils }:
  {

    nixosConfigurations.x = darwin.lib.darwinSystem {
      modules = [
        home-manager.darwinModules.home-manager
        self.nixosModules.darwin
        ./nix/vic.nix
      ];
    };

    nixosModules.darwin = {
      imports = [
        ./nix/system.nix
        ./nix/overlays.nix
        # ./nix/hm-link-apps.nix
      ];
    };

    packages.x86_64-darwin =
      self.nixosConfigurations.x.pkgs;

    defaultPackage.x86_64-darwin =
      self.nixosConfigurations.x.system;

    defaultApp.x86_64-darwin = {
      type = "app";
      program =
        let
          program =
            with self.nixosConfigurations.x.pkgs;
            writeScriptBin "activate" ''
              sudo ${self.nixosConfigurations.x.system}/activate
            '';
        in "${program}/bin/activate";
    };

  };
}
