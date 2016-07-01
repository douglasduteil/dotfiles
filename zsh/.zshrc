local RC_PARTS_DIR=$ZSH_HOME/zshrc.d

local parts=($RC_PARTS_DIR)

# Load everything from parts directories
for dir in $parts; do
    for name in $dir/*.zsh; do
	source $name
    done
done
