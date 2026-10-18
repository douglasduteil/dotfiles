{
  description = "nixos-wsl shared package profile";

  # Claude Code plugins absent from claude-plugins-official, pinned here
  # instead of followed live; each repo is its own marketplace.
  inputs.caveman = { url = "github:JuliusBrussee/caveman"; flake = false; };
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.ponytail = { url = "github:DietrichGebert/ponytail"; flake = false; };

  outputs = { self, caveman, nixpkgs, ponytail }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
      # MCP server bridging Claude Code to TS7's native `tsgo` LSP (go to
      # def, find references, hover, diagnostics) -- see
      # https://github.com/paulvanbrenk/typescript-mcp. Wired into Claude
      # Code's user-scope MCP config by configure.sh. Needs `tsgo` (wrapper below)
      # on PATH at runtime -- it spawns it as a subprocess.
      typescript-mcp = pkgs.buildGoModule {
        pname = "typescript-mcp";
        version = "0.2.0";
        src = pkgs.fetchFromGitHub {
          owner = "paulvanbrenk";
          repo = "typescript-mcp";
          rev = "v0.2.0";
          sha256 = "18cwcxdfbkcngmh41xir814b07mxbzph7kpn6wypl418xq5nknkh";
        };
        vendorHash = "sha256-sTPgNW4eWJs7HKgUfN4Mz+MYwgVcNga7ifvzuGuNLeo=";
        subPackages = [ "cmd/typescript-mcp" ];
      };
    in {
      packages.${system}.default = pkgs.buildEnv {
        name = "nixos-wsl-profile";
        paths = with pkgs; [
          atuin
          bat
          bash-language-server
          bun
          chromium
          claude-code
          # Stable ~/.nix-profile path for `claude plugin marketplace add`.
          (pkgs.linkFarm "claude-plugins" [
            { name = "share/claude-plugins/caveman"; path = caveman; }
            { name = "share/claude-plugins/ponytail"; path = ponytail; }
          ])
          delta
          direnv
          fd
          ffmpeg
          fzf
          gcc
          gh
          git
          git-open
          gnumake
          hyperfine
          jq
          kubernetes-helm
          mkcert
          neovim
          nixd
          nodejs
          oh-my-zsh
          omp
          opencode
          podman-compose
          ripgrep
          scalingo
          sops
          (pkgs.writeShellScriptBin "ssh-askpass" ''exec env QT_QPA_PLATFORM=xcb ${pkgs.lxqt.lxqt-openssh-askpass}/bin/lxqt-openssh-askpass "$@"'')
          starship
          steam-run
          stow
          tree-sitter
          # nixpkgs ships TS7 native as `tsc` only; typescript-mcp spawns `tsgo`.
          (pkgs.writeShellScriptBin "tsgo" ''exec ${pkgs.typescript}/bin/tsc "$@"'')
          typescript-mcp
          (pkgs.writeShellScriptBin "x-memory" ''exec ${bun}/bin/bun "$HOME/.dotfiles/x-memory/src/cli.ts" "$@"'')
          yaml-language-server
          yazi
          yt-dlp
          zoxide
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
