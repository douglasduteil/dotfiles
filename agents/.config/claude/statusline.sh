#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
ROOT=$(echo "$input" | jq -r '.workspace.project_dir')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
USED=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')

CYAN='\033[36m'; YELLOW='\033[33m'; RED='\033[31m'; RESET='\033[0m'

fmt_tokens() {
  local n=$1
  if [ "$n" -ge 1000 ]; then
    awk -v n="$n" 'BEGIN{printf "%.1fk", n/1000}'
  else
    echo "$n"
  fi
}

if [ "$PCT" -ge 90 ]; then PCT_COLOR="$RED"
elif [ "$PCT" -ge 70 ]; then PCT_COLOR="$YELLOW"
else PCT_COLOR="$RESET"; fi

DIR_TXT=""
[ "$DIR" != "$ROOT" ] && DIR_TXT=" | 📁 ${DIR##*/}"

echo -e "${PCT_COLOR}${PCT}%${RESET} ($(fmt_tokens "$USED")/$(fmt_tokens "$SIZE")) ${CYAN}[$MODEL]${RESET}${DIR_TXT}"
