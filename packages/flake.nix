{
  description = "nixos-wsl shared package profile";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
    in {
      packages.${system}.default = pkgs.buildEnv {
        name = "nixos-wsl-profile";
        paths = with pkgs; [
          bat
          bun
          claude-code
          delta
          fd
          fzf
          gcc
          gh
          git
          git-open
          jq
          kubernetes-helm
          mkcert
          neovim
          nodejs
          oh-my-zsh
          ripgrep
          sops
          (pkgs.writeShellScriptBin "ssh-askpass" ''exec ${pkgs.x11_ssh_askpass}/libexec/x11-ssh-askpass "$@"'')
          starship
          tree-sitter
          yt-dlp
          zsh
          zsh-autosuggestions
          zsh-completions
          zsh-fast-syntax-highlighting
          zsh-fzf-history-search
          zsh-history-substring-search
        ];
      };
    };
}
