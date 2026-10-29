# Session cost (Claude Code, Claude Pro)

## Normative

- Cost scales with **context × turns**: every turn re-sends the whole
  conversation, CLAUDE.md and every file the agent read. A one-line question in
  an old session still pays for the whole conversation. `/clear` between
  unrelated tasks.
- Fix model and effort at session start. Switching either mid-session discards
  the prompt cache and reprocesses everything; same for plugin toggles, denied
  tools (with tool search off) and Claude Code upgrades.
- Fixed per-session context is charged on **every** request: skill listings
  (each enabled plugin's descriptions), instructions files, memory injections.
  Trim it before adding more.
- Explore in subagents; their context never enters the main conversation.
- Compact at task boundaries, not mid-task. Abandoning a path → `/rewind`
  (truncates to an already-cached prefix), not `/compact`.

## Signals

- Claude Pro meters **windows, not dollars**: a 5-hour session window and a
  weekly window with a fixed per-account reset. `cost.total_cost_usd` is
  list-price arithmetic, explicitly not billing for subscribers.
- Only the status line payload carries the plan percentages:
  `rate_limits.five_hour.used_percentage`, `rate_limits.seven_day.used_percentage`,
  alongside `context_window.used_percentage` and `prompt_cache.warm`. Hooks and
  OpenTelemetry carry no plan metric.
- `~/.claude/statusline.sh` warns once per session per threshold: context 60%,
  5h window 50% / 80%, weekly 70%, cache cold.
- omp: `session.warnCost` / `session.maxCost` (or `--warn-cost` / `--max-cost`);
  `omp stats --summary` and `omp usage` for the retrospective view.
- Sources: https://code.claude.com/docs/en/costs,
  https://code.claude.com/docs/en/statusline,
  https://code.claude.com/docs/en/prompt-caching (consulted 2026-10-29).

## Measured 2026-10-29 (this machine; Claude Code 2.1.309, omp 18.13.1)

- Fixed overhead: **30,212 tokens** in the first request — tools 5.6k, system
  1.3k, skill listing 7.0k (5.6k third-party plugins, 1.2k own), instructions
  4.6k, memory injection 2.4k.
- 378 omp sessions: 3.79B tokens, $1,026 API-equivalent, mean $2.72, max $40.9.
  Cost split: cache read 53%, cache write 29%, output 16%, fresh input 1.4%.
- Tool cost share: bash 49%, read 24%, edit 15%, grep 9%. Longest sessions ran
  174–210 requests over 148k–181k context.

## Gotchas

- `jq '.x // empty'` returns empty when `.x` is `false` (`//` treats `false` as
  absent). Test booleans with `== false`, or a cold-cache check never fires.
- `notify-send` is absent on this WSL host; the status line falls back to a
  Windows toast through `powershell.exe` (~0.3 s per toast).
