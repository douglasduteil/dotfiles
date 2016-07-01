XDG_CONFIG_HOME=$HOME/.config
ZSH_HOME=$XDG_CONFIG_HOME/zsh
local ENV_PARTS_DIR=$ZSH_HOME/zshenv.d

local parts=($ENV_PARTS_DIR)

# Load everything from parts directories
for dir in $parts; do
    for name in $dir/*.zsh; do
	source $name
    done
done
