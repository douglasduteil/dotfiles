local PROFILE_PARTS=$ZSH_HOME/zprofile.d

local parts=($PROFILE_PARTS)

# Load everything from parts directories
for dir in $parts; do
    for name in $dir/*.zsh; do
	source $name
    done
done
