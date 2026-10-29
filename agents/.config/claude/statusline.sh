#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
ROOT=$(echo "$input" | jq -r '.workspace.project_dir')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
USED=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
FIVE=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
WEEK=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
SID=$(echo "$input" | jq -r '.session_id // "?"')
WARM=$(echo "$input" | jq -r 'if .prompt_cache.warm == false then "cold" else "warm" end')

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

PLAN_TXT=""
[ -n "$FIVE" ] && PLAN_TXT="$PLAN_TXT | 5h $(printf '%.0f' "$FIVE")%"
[ -n "$WEEK" ] && PLAN_TXT="$PLAN_TXT | 7d $(printf '%.0f' "$WEEK")%"

echo -e "${PCT_COLOR}${PCT}%${RESET} ($(fmt_tokens "$USED")/$(fmt_tokens "$SIZE")) ${CYAN}[$MODEL]${RESET}${PLAN_TXT} | \$$(printf '%.2f' "$COST")${DIR_TXT}"

# Cost warnings: once per session per threshold. Context cost grows with the
# square of the turn count, so the tail is where a session gets expensive.
toast_ps1="${TMPDIR:-/tmp}/cc-toast.ps1"
[ -f "$toast_ps1" ] || cat >"$toast_ps1" <<'PS'
param([string]$Title,[string]$Body)
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$tpl = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$t = $tpl.GetElementsByTagName("text")
$t.Item(0).AppendChild($tpl.CreateTextNode($Title)) | Out-Null
$t.Item(1).AppendChild($tpl.CreateTextNode($Body)) | Out-Null
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show([Windows.UI.Notifications.ToastNotification]::new($tpl))
PS

notify() {
  if command -v notify-send >/dev/null 2>&1; then
    notify-send -u "${1:-normal}" "$2" "$3"
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w "$toast_ps1")" "$2" "$3" >/dev/null 2>&1
  else
    printf '\a' >&2
  fi
}

state="${XDG_RUNTIME_DIR:-/tmp}/cc-cost-${SID}"
once() { grep -qx "$1" "$state" 2>/dev/null && return 1; echo "$1" >>"$state"; }

[ "$(printf '%.0f' "$PCT")" -ge 60 ] && once ctx60 &&
  notify normal "Claude Code: context ${PCT}%" "compact or /clear at the next break · \$$COST equivalent"
[ -n "$FIVE" ] && [ "$(printf '%.0f' "$FIVE")" -ge 50 ] && once five50 &&
  notify normal "Claude Code: 5h window ${FIVE}%" "session burn high · \$$COST equivalent"
[ -n "$FIVE" ] && [ "$(printf '%.0f' "$FIVE")" -ge 80 ] && once five80 &&
  notify critical "Claude Code: 5h window ${FIVE}%" "finish the task, stop spawning subagents"
[ -n "$WEEK" ] && [ "$(printf '%.0f' "$WEEK")" -ge 70 ] && once week70 &&
  notify critical "Claude Code: weekly ${WEEK}%" "limit resets $(date -d @"$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // 0')" '+%a %H:%M')"
[ "$WARM" = "cold" ] && once cold &&
  notify low "Claude Code: prompt cache cold" "next turn reprocesses the whole context"

exit 0
