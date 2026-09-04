# =================================================================
# XDG Config
# =================================================================

# User specific data files
export DOTFILES_DIR="$HOME/.dotfiles"

export XDG_BIN_DIR="$HOME/bin"
export XDG_CACHE_HOME="$HOME/.cache"
export XDG_CONFIG_DIR="$HOME/.config"
export XDG_LOCAL_DIR="$HOME/.local"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_STATE_HOME="$HOME/.local/state"
export XDG_PROGRAMS_DIR="$HOME/programs"
export XDG_TEMPLATES_DIR="$HOME/Templates"

# :: https://code.claude.com/docs/en/authentication -- relocates
# settings.json, credentials, transcripts, etc. out of ~/.claude
export CLAUDE_CONFIG_DIR="$HOME/.config/claude"

# GUI PIN prompt for FIDO2/YubiKey SSH signing when no tty is attached
# (e.g. commits run by Claude Code). Interactive terminal use is unaffected.
export SSH_ASKPASS="$HOME/.nix-profile/bin/ssh-askpass"

# =================================================================
#
# =================================================================
