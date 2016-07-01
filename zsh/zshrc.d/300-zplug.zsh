# ===========================================================================
# Init zplug
# ===========================================================================

# First-time run: need to download zplug if it doesn't exist
[[ -f $ZPLUG_HOME/zplug ]] || (echo "zplug missing, please install http://git.io/zplug to $ZPLUG_HOME" && exit 1)
source $ZPLUG_HOME/zplug

# ===========================================================================
# Plugins
# ===========================================================================


# zsh plugins
zplug "zsh-users/zsh-completions"

# pure prompt
# zplug "mafredri/zsh-async", nice:1
# zplug "sindresorhus/pure", nice:2

# fzf
zplug "junegunn/fzf-bin", \
    as:command, \
    from:gh-r, \
    file:fzf, \
    of:"*linux*amd64*"
zplug "junegunn/fzf", nice:1

# others
zplug "zsh-users/zsh-syntax-highlighting", nice:15
zplug "tarruda/zsh-autosuggestions", nice:16
zplug "chrissicool/zsh-256color"

# Manage zplug
zplug "b4b4r07/zplug"


# ===========================================================================
# Install plugins
# ===========================================================================

# Install plugins if they've not been installed
if ! zplug check --verbose; then
    printf "Install? [y/N]: "
    if read -q; then
	echo; zplug install
    fi
fi

# ===========================================================================
# Load plugins
# ===========================================================================

zplug load

# ===========================================================================
#
# ===========================================================================
