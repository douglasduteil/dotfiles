# =================================================================
# Zinit Config
# =================================================================

export ZINIT_HOME="$XDG_PROGRAMS_DIR/zinit"

declare -A ZINIT
# Zinit will skip checking if a Turbo-loaded object exists on the disk.
# from https://github.com/zdharma-continuum/zinit/blob/708684c368fb62cbfae21364674d0a7c83e3a654/README.md#customizing-paths
export ZINIT[OPTIMIZE_OUT_DISK_ACCESSES]=1

# =================================================================
#
# =================================================================
