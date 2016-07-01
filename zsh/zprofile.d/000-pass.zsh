# $HOME/.zprofile
export ZPROFILE_RUN=1

# KDM is sourcing this file
if [ -n "$session" ]; then
    display_manager="yes"
fi

# Call these only if not being sourced by a display manager
if [ -z "$display_manager" ]; then
    #For fortune/cowsay/ddate combo
    echo ""
    /usr/games/fortune -a
    echo ""
    /usr/bin/ddate
    #echo ""
fi
