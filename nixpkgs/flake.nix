{
  description = "dougalsduteil home-manager";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    darwin.url = "github:lnl7/nix-darwin";
    darwin.inputs.nixpkgs.follows = "nixpkgs";
    home.url = "github:nix-community/home-manager";
    home.inputs.nixpkgs.follows = "nixpkgs";

  };

  outputs = inputs:
    let
      inherit (import ./lib inputs) switchers overlays importModulesDir;
    in
      {
        inherit overlays;
        inherit (switchers) apps devShell;

        darwinModules = importModulesDir ./darwin/modules;
        darwinConfigurations = import ./darwin/configurations inputs;

        homeModules = importModulesDir ./home/modules;
        homeManagerConfigurations = import ./home/configurations inputs;

        nixosModules = importModulesDir ./nixos/modules;
        nixosConfigurations = import ./nixos/configurations inputs;
      };
}
