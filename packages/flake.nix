{
  description = "nixos-wsl shared package profile";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.omp.url = "github:can1357/oh-my-pi";

  outputs = { self, nixpkgs, omp }:
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
      # TS7's native Go-based language server. Ships as a platform-specific
      # npm package (no nixpkgs derivation yet) with the binary and its
      # lib/*.d.ts siblings flattened in one dir -- it resolves those by
      # path relative to its own executable, so they must stay alongside it
      # (hence $out/libexec rather than splitting into bin+share). Spawned
      # by typescript-mcp below; needs to be on PATH for that to work.
      tsgo = pkgs.stdenv.mkDerivation {
        pname = "tsgo";
        version = "7.0.0-dev.20260707.2";
        src = pkgs.fetchurl {
          url = "https://registry.npmjs.org/@typescript/native-preview-linux-x64/-/native-preview-linux-x64-7.0.0-dev.20260707.2.tgz";
          hash = "sha512-du0dzi6y97Po5vDNdPJTyyijHCpaS22JLRnKZEJXBDaO9gCIymOv/5QQokFRuOlQm0bWl3i9PF4OVdGP6uAOQA==";
        };
        dontBuild = true;
        installPhase = ''
          mkdir -p $out/libexec $out/bin
          cp -r lib/. $out/libexec/
          chmod +x $out/libexec/tsgo
          ln -s $out/libexec/tsgo $out/bin/tsgo
        '';
      };
      # MCP server bridging Claude Code to TS7's native `tsgo` LSP (go to
      # def, find references, hover, diagnostics) -- see
      # https://github.com/paulvanbrenk/typescript-mcp. Wired into Claude
      # Code's user-scope MCP config by configure.sh. Needs `tsgo` (above)
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
          omp.packages.${system}.omp
          opencode
          podman-compose
          ripgrep
          sops
          (pkgs.writeShellScriptBin "ssh-askpass" ''exec env QT_QPA_PLATFORM=xcb ${pkgs.lxqt.lxqt-openssh-askpass}/bin/lxqt-openssh-askpass "$@"'')
          starship
          steam-run
          tree-sitter
          tsgo
          typescript-mcp
          (pkgs.writeShellScriptBin "x-memory" ''exec ${pkgs.bun}/bin/bun "$HOME/.dotfiles/x-memory/src/cli.ts" "$@"'')
          yazi
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
