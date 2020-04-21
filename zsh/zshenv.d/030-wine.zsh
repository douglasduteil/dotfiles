# =================================================================
# Wine Config
# =================================================================

export WINE_LOCAL_DIR="/run/media/x/home sweet home/x/.local"; # was $XDG_LOCAL_DIR but wine went too big...
export WINE_DIR="$WINE_LOCAL_DIR/wine";
mkdir -p $WINE_DIR;

export WINEARCH=win64
export WINEPREFIX="$WINE_DIR/win64";
# one liner : WINEARCH=win64 WINEPREFIX="$WINE_DIR/win64"

# export WINEARCH=win32
# export WINEPREFIX="$WINE_DIR/win32"
# one liner : WINEARCH=win32 WINEPREFIX="$WINE_DIR/win32"

# =================================================================
#
# =================================================================