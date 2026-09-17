#!/usr/bin/env bash
# Merge the tracked actions.json into the host's Windows Terminal settings,
# touching only the "actions" key. Run from WSL:
#   ./sync.sh
# Safe to rerun -- backs up the live file to settings.json.bak first.
set -euo pipefail

WINDOWS_USER="${WINDOWS_USER:?set WINDOWS_USER to your Windows account name}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="/mnt/c/Users/${WINDOWS_USER}/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

if [ ! -f "$TARGET" ]; then
  echo "live settings.json not found: $TARGET" >&2
  exit 1
fi

cp "$TARGET" "$TARGET.bak"
# Strip full-line // comments (WT uses JSONC) so jq can parse.
grep -v '^[[:space:]]*//' "$TARGET.bak" | jq --slurpfile a "$HERE/actions.json" '.actions = $a[0]' > "$TARGET"
echo "merged actions into $TARGET (backup: $TARGET.bak)."
