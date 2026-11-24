# Memory index (global)

This file is a **router**, not a summary. Read it once, follow the links that
match the current task, skip the rest. Do not read every page on every turn.

Add a page below only when there is something worth preserving. Prefer
extending an existing page over creating a new one.

This file is public: it keeps the essence of a lesson, with machine-bound
values replaced by their role. Machine-only pages — key paths, serials,
hostnames, drive letters, private repo names — live in
`~/.local/share/agents/x-memory/` and are routed by the `index.md` there; none
of them is listed below.

## Pages

- [Glossary](glossary.md) — before reusing a wiki word in a new page or skill, or when two pages seem to mean different things by a tier, a scope or a lead.
- [JS/TS tooling gotchas](js_tooling_gotchas.md) — before using a Bun runtime API (`serve`, `WebView`, `markdown`, dev server), Sentry, typescript-mcp diagnostics, or a tool that imports `typescript` on TS 7. TypeScript preferences live in the `x-ts-constitution` skill, not here.
- [htmx](htmx.md) — before adding `hx-get` to a container, or debugging a second request or reset state after a click.
- [Code style preferences](code_style.md) — before writing any comment, and for general conventions (alpha ordering, branch/PR shape, CI pinning, config validation, Intl for user-facing formatting) that apply across projects unless opted out.
- [x-memory CLI usage](x-memory-tool.md) — before any memory lookup: the four tiers, lookup order, and what an empty result does not prove.
- [Subtle rule shapes](state_and_draws.md) — before writing a rule that tracks a milestone, a best-so-far, or a random pick from a table.
- [Testing preferences](testing.md) — proof order (types first, tests last) and where it overrides plugin skills' test defaults; before writing, planning or reviewing any test, before proving a refactor changed no behaviour, before judging a review lead or a measured rate, and before running any jest-backed test command (worker cap, mongodb-memory-server on NixOS).
- [npm preferences / quirks](npm.md) — allowScripts advisory-only status, before relying on npm's script-approval mechanism.
- [Agent commits](agent_commits.md) — before a fork commits, when a commit's author or signature looks off, when using the eval `commit` namespace, or when deciding whether plain git is enough.
- [Git / PR workflow preferences](git_workflow.md) — before naming a branch, committing, splitting a mixed diff, or writing a commit or PR body; overrides the `pr` skill's test-run evidence sections; includes the `wt` (worktrunk) worktree routing.
- [Guard config edits: tmp-script procedure](guard_config_edits.md) — the moment a guard blocks a config edit or any command naming a guarded path; also before proposing to verify such a file.
- [DeepSeek aliases on OpenRouter](deepseek_aliases.md) — before picking a cheap/fast model tier for agents or subagents.
- [Secrets: ask, never extract](secrets.md) — before reading any credential/token/config store, and the moment a task is blocked on a missing or tool-blocked credential (API token, key, password). Ask, never hunt.
- [Agent security incidents](incidents.md) — before loosening any guard (deny pattern, permission, hook), and when a guard blocks you and the next move feels like a workaround.
- [Delivery / orchestration methodology](delivery_methodology.md) — before orchestrating multi-step work, delegating to subagents, or choosing task granularity/sequencing.
- [Session cost: Pro windows, statusline signals, context levers](session_cost.md) — before designing cost/usage notifications, trimming agent context, or when a session is getting expensive.
- [opencode plugin API version gotchas](opencode_plugins.md) — before writing or wiring any opencode plugin or hook.
- [Browser rendering performance](web_perf.md) — before measuring page CPU, blaming compositing, or debugging Canvas 2D artifacts.
- [Browser screens](browser_screens.md) — before writing, debugging or proving a `requestAnimationFrame` screen: frame-loop death, an entity added mid-state, and the harness that lives outside the repo.
- [Nix packaging](nix_packaging.md) — only when packaging a Go binary via `buildGoModule`, or pinning an external binary into a flake profile.
- [Shell gotchas](shell_gotchas.md) — before writing separators or `=`-prefixed words in a command that may run under zsh.
- [HDMI capture from WSL2](hdmi_capture_wsl.md) — before viewing another computer's screen through a USB HDMI capture card on a WSL2 machine.
- [Postgres data migrations](postgres_migrations.md) — before writing a data-changing migration (node-pg-migrate transaction model, planner traps on unnest/CTE, PGlite smoke testing).

## Cross-references

- Project-tier memory: `<project>/.agents/x-memory/index.md`
- Machine-only memory: `~/.local/share/agents/x-memory/index.md` (read after this router misses)
- Session-history search: `x-memory` CLI (`x-memory query --project <dir>`)
- Curated-memory convention: see shared user-level `AGENTS.md`
