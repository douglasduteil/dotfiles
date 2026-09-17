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
      nodejs = pkgs.stdenv.mkDerivation {
        pname = "nodejs";
        version = "24.21.0";
        src = pkgs.fetchurl {
          url = "https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.xz";
          sha256 = "fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6";
        };
        nativeBuildInputs = [ pkgs.autoPatchelfHook ];
        buildInputs = [ pkgs.stdenv.cc.cc.lib ];
        dontBuild = true;
        installPhase = ''
          mkdir -p $out
          cp -r . $out/
        '';
      };
    in {
      packages.${system}.default = pkgs.buildEnv {
        name = "nixos-wsl-profile";
        paths = with pkgs; [
          bat
          bun
          chromium
          claude-code
          delta
          fd
          fzf
          gcc
          gh
          git
          git-open
          gnumake
          jq
          kubernetes-helm
          mkcert
          neovim
          nodejs
          oh-my-zsh
          opencode
          podman-compose
          ripgrep
          sops
          (pkgs.writeShellScriptBin "ssh-askpass" ''exec env QT_QPA_PLATFORM=xcb ${pkgs.lxqt.lxqt-openssh-askpass}/bin/lxqt-openssh-askpass "$@"'')
          starship
          tree-sitter
          (pkgs.writeShellScriptBin "x-memory" ''exec ${pkgs.bun}/bin/bun "$HOME/.dotfiles/x-memory/src/cli.ts" "$@"'')
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
