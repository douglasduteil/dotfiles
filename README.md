![](https://raw.githubusercontent.com/jglovier/dotfiles-logo/master/dotfiles-logo.png)

# nixos-wsl

User-level Nix profile for NixOS-WSL machines: stow-managed dotfiles plus a locked package flake.

## Contents

- `nix` (stow package) — `~/.config/nix/nix.conf` (enables `nix-command`/`flakes`) and `~/.config/nixpkgs/config.nix` (`allowUnfree`)
- `git` (stow package) — `~/.gitconfig`, `~/.gitignore_global`, and `~/.config/git/allowed_signers` (FIDO2 SSH signing verification; `user.signingkey` itself is set per-machine via the untracked `~/.config/git/gitconfig` include)
- `ssh` (stow package) — `~/.ssh/config`, pointing github.com at both the work and home FIDO2 signing keys via `IdentityFile` (`IdentitiesOnly yes`); listing both unconditionally is what makes the one file work on every machine, since ssh silently skips whichever IdentityFile doesn't exist locally. No key material lives here -- only paths, and the actual private/public key pairs stay untracked per machine
- `nvim` (stow package) — LazyVim config vendored from [LazyVim/starter](https://github.com/LazyVim/starter) into `~/.config/nvim`
- `zsh` (stow package) — `~/.zshenv` (XDG vars) and `~/.zshrc` (oh-my-zsh libs/plugins, autosuggestions, syntax highlighting, history search, fzf, starship — all nix-managed, no runtime plugin manager)
- `claude` (stow package) — `~/.config/claude/settings.json` (theme, attribution trailers off, etc.) and `~/.config/claude/skills/`. `zsh/.zshenv` sets `CLAUDE_CONFIG_DIR` to relocate Claude Code's whole config dir here (settings, credentials, transcripts, caches) instead of `~/.claude` -- only `settings.json` and `skills/` are version-controlled. `~/.claude` itself is kept as a plain symlink to `~/.config/claude` (see Install) so anything that still hardcodes the old path lands on the same live state instead of silently writing to a stale duplicate
- `packages` (flake, not stowed) — a locked `flake.lock` pinning the exact nixpkgs revision for everything above plus the rest of the CLI toolset; see `packages/flake.nix` for the current list rather than duplicating it here

## Install

```sh
git clone -b nixos-wsl --single-branch git@github.com:douglasduteil/dotfiles.git ~/.dotfiles

# dotfiles: nix.conf/config.nix, git identity, ssh config, neovim config, zsh config, claude settings
nix-shell -p stow --run 'stow -d ~/.dotfiles -t ~ nix git ssh nvim zsh claude'

# packages: pinned via packages/flake.lock
nix profile install ~/.dotfiles/packages#default
```

On a machine that hasn't stowed `nix` yet (so `nix-command`/`flakes` aren't enabled), run the package install with the flags inline instead:

```sh
nix --extra-experimental-features "nix-command flakes" profile install ~/.dotfiles/packages#default
```

`nix-shell -p stow` (rather than `nix profile install nixpkgs#stow`) sidesteps a chicken-and-egg problem: a flake install needs `nix-command`/`flakes` already enabled, which is exactly what the stowed `nix.conf` provides.

Set zsh as the login shell separately, declaratively, in `/etc/nixos/configuration.nix`:

```nix
programs.zsh.enable = true;
users.users.<you>.shell = pkgs.zsh;
```

`CLAUDE_CONFIG_DIR` doesn't migrate an existing install automatically -- on a machine with prior Claude Code state, move it over once, in a fresh shell that already has `CLAUDE_CONFIG_DIR` set:

```sh
rsync -a ~/.claude/ ~/.config/claude/   # skip settings.json, which stow provides
cp -a ~/.claude.json ~/.config/claude/.claude.json   # this one lives in $HOME, not ~/.claude/
```

Do this before first starting `claude` in the new shell -- otherwise it finds no `.claude.json` at the new path and silently starts a fresh one, and the real state has to be copied over it afterward.

Then retire the old `~/.claude` directory in favor of a symlink, so any tool that still looks there transparently hits the same live state (stow can't express this itself -- it only mirrors package content into place, and the target here is `~/.config/claude`, not repo content):

```sh
mv ~/.claude ~/.claude.bak-$(date +%Y%m%d-%H%M%S)   # keep as a safety net, don't delete
ln -s ~/.config/claude ~/.claude
```

## SSH commit signing

Commits are signed with a hardware-backed FIDO2 key (`sk-ssh-ed25519`), one per machine, matching the `work`/`home` labels already used in `ssh/.ssh/config` and `git/.config/git/allowed_signers`. The private key file is bound to the physical security key it was generated on and is never tracked by `~/.dotfiles`.

**A machine that already has its key** (e.g. reinstalling `work` or `home`) just needs the per-machine include pointing at it -- the `git` package's `[include] path = ~/.config/git/gitconfig` picks this up automatically once stowed:

```sh
mkdir -p ~/.config/git
cat > ~/.config/git/gitconfig <<'EOF'
# machine-local git config, not tracked by ~/.dotfiles
# sets which physical FIDO2 key this machine currently signs with

[user]
	signingkey = ~/.ssh/git_signing_key_<work|home>
EOF
```

**A genuinely new machine/key** needs a key generated and registered in three places:

```sh
# 1. generate a new hardware-backed key -- prompts for a security-key
#    touch (and possibly a PIN, depending on the key's own FIDO2 policy)
ssh-keygen -t ed25519-sk -f ~/.ssh/git_signing_key_<label> -C git-signing-<label>

# 2. register the public half for local signature verification
#    (tracked -- commit and push this from ~/.dotfiles)
echo "$(git config user.email) $(cat ~/.ssh/git_signing_key_<label>.pub)" \
  >> ~/.dotfiles/git/.config/git/allowed_signers

# 3. point this machine at it (untracked, per-machine -- same file as above)
mkdir -p ~/.config/git
printf '[user]\n\tsigningkey = ~/.ssh/git_signing_key_%s\n' <label> > ~/.config/git/gitconfig
```

Then also add a matching `IdentityFile ~/.ssh/git_signing_key_<label>` line to `ssh/.ssh/config` (tracked -- commit and push), and register the same public key on GitHub itself under *Settings → SSH and GPG keys*: once as an **Authentication Key** (needed for `git push`/`fetch` over SSH) and once as a **Signing Key** (needed for the green "Verified" badge on GitHub -- `allowed_signers` only covers local `git log --show-signature` verification, GitHub keeps its own copy).

## Updating the package set

Edit `packages/flake.nix`, then from `packages/`:

```sh
nix flake lock --update-input nixpkgs   # bump to latest nixpkgs-unstable
nix profile upgrade default             # apply on this machine
```

## Inspired by

- [`master`](https://github.com/douglasduteil/dotfiles/tree/master) — the flat, stow-shaped dotfiles layout this branch follows
- [`nix`](https://github.com/douglasduteil/dotfiles/tree/nix) — the sibling branch for machines where Nix runs standalone (home-manager, non-NixOS); this branch is the real-NixOS counterpart
