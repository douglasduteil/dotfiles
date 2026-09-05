![](https://raw.githubusercontent.com/jglovier/dotfiles-logo/master/dotfiles-logo.png)

# nixos-wsl

User-level Nix profile for NixOS-WSL machines: stow-managed dotfiles plus a locked package flake.

## Contents

- `nix` (stow package) — `~/.config/nix/nix.conf` (enables `nix-command`/`flakes`) and `~/.config/nixpkgs/config.nix` (`allowUnfree`)
- `git` (stow package) — `~/.gitconfig` (identity, plus `[include] path = ~/.config/git/gitconfig` for the untracked per-machine default signing key) and `~/.config/git/allowed_signers` (FIDO2 SSH signing verification, both keys)
- `ssh` (stow package) — `~/.ssh/config` and `~/.ssh/update-signing-key-symlink`. A `Match exec` block runs the script before auth to detect (via `ykman list --serials`, no touch needed) which of the two FIDO2 keys is physically plugged in, and points `~/.ssh/git_signing_key_active` at its handle file; `IdentityFile` then offers only that one. Avoids `ssh` blindly trying (and touching) the unplugged key first. No key material lives here -- only paths and serials (see SSH commit signing)
- `nvim` (stow package) — LazyVim config vendored from [LazyVim/starter](https://github.com/LazyVim/starter) into `~/.config/nvim`
- `zsh` (stow package) — `~/.zshenv` (XDG vars) and `~/.zshrc` (oh-my-zsh libs/plugins, autosuggestions, syntax highlighting, history search, fzf, starship — all nix-managed, no runtime plugin manager)
- `claude` (stow package) — `~/.config/claude/settings.json` (theme, attribution trailers off, etc.) and `~/.config/claude/skills/`. `zsh/.zshenv` sets `CLAUDE_CONFIG_DIR` to relocate Claude Code's whole config dir here (settings, credentials, transcripts, caches) instead of `~/.claude` -- only `settings.json` and `skills/` are version-controlled. `~/.claude` itself is kept as a plain symlink to `~/.config/claude` (see Install) so anything that still hardcodes the old path lands on the same live state instead of silently writing to a stale duplicate
- `packages` (flake, not stowed) — a locked `flake.lock` pinning the exact nixpkgs revision for everything above plus the rest of the CLI toolset; see `packages/flake.nix` for the current list rather than duplicating it here
- `nixos/configuration.nix` (template, not stowed) — a copy-paste starting point for `/etc/nixos/configuration.nix`: zsh shell, YubiKey USB/IP passthrough, `pcscd`, and the FIDO2/`plugdev` udev fix SSH commit signing depends on. Not stowed because most of it is genuinely per-machine (USB busids, `stateVersion`, the username); see Install

## Install

```sh
git clone -b main --single-branch git@github.com:douglasduteil/dotfiles.git ~/.dotfiles

# Create these as real directories *before* stowing -- if a stow target
# directory doesn't exist yet, stow folds the whole package subtree into
# one directory symlink instead of symlinking individual files. For most
# packages that's fine, but ~/.config/claude and ~/.config/git each also
# need to hold real, untracked, per-machine files alongside the symlinked
# ones (Claude Code's credentials/sessions/caches; git's per-machine
# signingkey include) -- folding would make stow symlink the whole
# directory into ~/.dotfiles, so anything written there afterward lands
# physically inside the git working tree instead of staying untracked.
mkdir -p ~/.config/claude ~/.config/git

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

A few more things need to be declared separately in `/etc/nixos/configuration.nix` -- system-level, not stowed, and (for the YubiKey block) a hard prerequisite for the SSH commit signing section below to work at all. `nixos/configuration.nix` in this repo is a copy-paste template covering all of it (zsh shell, YubiKey USB/IP passthrough, pcscd, and the FIDO2/plugdev udev fix) -- it's not stowed because most of it is genuinely per-machine (USB busids, `stateVersion`, the username), so copy it over and fill in the `<placeholders>`:

```sh
sudo cp /etc/nixos/configuration.nix /etc/nixos/configuration.nix.bak-$(date +%Y%m%d-%H%M%S)   # keep as a safety net, don't delete
sudo cp ~/.dotfiles/nixos/configuration.nix /etc/nixos/configuration.nix
sudo $EDITOR /etc/nixos/configuration.nix   # fill in <you>, <busid> (from `usbipd.exe list` on Windows), <nixos-release>
sudo nixos-rebuild switch
```

If a YubiKey was already plugged in *before* this rebuild, the already-created `/dev/hidraw*` nodes won't pick up the new rule on their own -- either replug the key or re-trigger udev:

```sh
sudo udevadm control --reload
sudo udevadm trigger --subsystem-match=hidraw
```

Group membership (`plugdev`) is cached at login, so open a fresh shell (or fully re-login) afterward before relying on it.

**Don't run `claude` at all until after both `mkdir -p ~/.config/claude` and `stow ... claude` above have run, in a shell that has since been restarted** (so the stowed `.zshenv` has actually set `CLAUDE_CONFIG_DIR`). Starting it any earlier makes Claude Code fall back to the old default `~/.claude` location instead of the intended relocated one, on top of the stow-folding risk `mkdir -p` above already heads off.

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

`ssh-keygen -K` below and `ssh -T git@github.com` need a real interactive terminal -- each prompts for the key's PIN and needs a physical touch, so neither can be scripted or run non-interactively. If Claude is walking through this README to set up a machine, it can prepare everything up to one of these commands, but has to hand that specific command back to the human to run themselves, then resume for the file-placement/config steps after.

Signing a commit is the exception: `SSH_ASKPASS` (set in `zsh/.zshenv`) makes `ssh-keygen -Y sign` fall back to a GUI PIN prompt whenever there's no tty attached -- e.g. Claude Code running `git commit` itself. The human still enters the PIN and touches the key, just through a popup instead of the terminal; a plain interactive `git commit` in a real terminal keeps prompting there as before, since OpenSSH's askpass fallback only fires when there's no tty to use.

Commits are signed with a hardware-backed FIDO2 key (`sk-ssh-ed25519`). There are two physical YubiKeys, `alpha` and `beta` -- **not** one per machine; either one works from any machine, each acting as the other's backup. Locally each is a private-key handle file (the FIDO2 credential wrapper OpenSSH stores on disk -- not the underlying secret, which never leaves the hardware), named `~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>`, e.g. `git_signing_key_Y5C-beta-36628851` for a YubiKey 5C NFC (`ykman info` prints model/serial). These files are never tracked by `~/.dotfiles`.

Both credentials are resident (discoverable) on the hardware, so a machine missing the handle file for a given key doesn't need it copied over by hand -- plug that physical key in and pull it straight from the device instead:

```sh
ssh-keygen -K   # prompts for the key's PIN + a touch; downloads every
                 # resident credential on the plugged-in key into $PWD
mv id_ed25519_sk_rk ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>
mv id_ed25519_sk_rk.pub ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>.pub
```

`ssh-keygen -K` downloads *every* resident credential on the plugged-in key, not just the git-signing one -- if the same physical YubiKey also holds other resident keys (e.g. a separate SSH-auth key for another service), it saves those too, under names like `id_ed25519_sk_rk_<label>`. Match each recovered `.pub` file's base64 blob against the entry already in `~/.dotfiles/git/.config/git/allowed_signers` to identify which downloaded file is actually the git-signing key before renaming it.

Run it once per physical key (swap in the other YubiKey and re-run to recover that one too). `git`/`ssh` are already stowed and need nothing else once the file's in place.

`ssh/.ssh/config` detects the plugged-in key at connect time (see `ssh` package above) rather than listing both `IdentityFile`s unconditionally, so `ssh` (and therefore `git push`/`fetch`) transparently uses whichever key is physically plugged in, with a single touch/PIN prompt instead of trying the absent key first. Commit *signing* needs one definite default though (`user.signingkey` can't try-and-fall-back like `ssh` does), so that part alone stays a small per-machine, untracked include -- picking which of the two keys this machine reaches for first:

```sh
# machine-local, not tracked -- swap to the other filename any time
# you're signing with the other physical key instead
mkdir -p ~/.config/git
printf '[user]\n\tsigningkey = ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial>\n' \
  > ~/.config/git/gitconfig
```

(To sign a single commit with the *other* key without changing the default: `git -c user.signingkey=~/.ssh/git_signing_key_<other> commit ...`.)

**A genuinely new key** (replacing a lost/retired YubiKey) needs generating once and registering in two places -- the only steps that can't be done by `stow`, since they're either hardware-bound or live on GitHub's own servers:

```sh
# generate -- -O resident is what makes the ssh-keygen -K recovery above
# work later; prompts for a security-key touch (and possibly a PIN,
# depending on the key's own FIDO2 policy)
ssh-keygen -t ed25519-sk -O resident -f ~/.ssh/git_signing_key_<model>-<alpha|beta>-<serial> \
  -C "git-signing-<model>-<alpha|beta>-<serial>"

# register the public half for local signature verification
# (tracked -- commit and push this from ~/.dotfiles)
echo "$(git config user.email) $(cat ~/.ssh/git_signing_key_<...>.pub)" \
  >> ~/.dotfiles/git/.config/git/allowed_signers
```

Then also add its `IdentityFile` line to `ssh/.ssh/config` (tracked -- commit and push), copy the new handle file to every other machine, and register the same public key on GitHub itself under *Settings → SSH and GPG keys*: once as an **Authentication Key** (needed for `git push`/`fetch` over SSH) and once as a **Signing Key** (needed for the green "Verified" badge -- `allowed_signers` only covers local `git log --show-signature` verification, GitHub keeps its own separate copy).

## Updating the package set

Edit `packages/flake.nix`, then from anywhere (no `cd` into `packages/` needed):

```sh
nix flake lock ~/.dotfiles/packages --update-input nixpkgs   # bump to latest nixpkgs-unstable
nix profile upgrade packages                                 # apply on this machine
```

The name to upgrade is `packages` (derived from the `packages/` dirname at install time), not `default` (the flake *attribute* used only at install) -- check with `nix profile list` if unsure.

`nix profile upgrade` has no `pacman -Syu`-style confirm prompt -- it just applies. The nix-profile way to review before keeping a change is generations + rollback instead of a pre-apply prompt:

```sh
nix profile upgrade packages  # applies immediately, creates a new profile generation
nix profile diff-closures     # review what actually changed, generation by generation
nix profile rollback          # undo -- back to the previous generation, if you don't like it
```

## Inspired by

- [`master`](https://github.com/douglasduteil/dotfiles/tree/master) — the flat, stow-shaped dotfiles layout this branch follows
- [`nix`](https://github.com/douglasduteil/dotfiles/tree/nix) — the sibling branch for machines where Nix runs standalone (home-manager, non-NixOS); this branch is the real-NixOS counterpart
