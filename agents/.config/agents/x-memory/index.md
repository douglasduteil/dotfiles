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
- [Testing preferences](testing.md) — jest CPU/worker cap, mongodb-memory-server on NixOS; before running any jest-backed test command.
- [npm preferences / quirks](npm.md) — allowScripts advisory-only status, before relying on npm's script-approval mechanism.
- [Agent commits](agent_commits.md) — before a fork commits, or when a commit's author or signature looks off.
- [Git / PR workflow preferences](git_workflow.md) — before naming a branch, committing, or opening a PR; includes the `wt` (worktrunk) worktree routing.
- [Guard config edits: tmp-script procedure](guard_config_edits.md) — the moment a guard blocks a config edit or any command naming a guarded path; also before proposing to verify such a file.
- [DeepSeek aliases on OpenRouter](deepseek_aliases.md) — before picking a cheap/fast model tier for agents or subagents.
- [Secrets: ask, never extract](secrets.md) — before reading any credential/token/config store, and the moment a task is blocked on a missing or tool-blocked credential (API token, key, password). Ask, never hunt.
- [Agent security incidents](incidents.md) — before loosening any guard (deny pattern, permission, hook), and when a guard blocks you and the next move feels like a workaround.
- [Delivery / orchestration methodology](delivery_methodology.md) — before orchestrating multi-step work, delegating to subagents, or choosing task granularity/sequencing.
- [Session cost: Pro windows, statusline signals, context levers](session_cost.md) — before designing cost/usage notifications, trimming agent context, or when a session is getting expensive.
- [opencode plugin API version gotchas](opencode_plugins.md) — before writing or wiring any opencode plugin or hook.
- [Browser rendering performance](web_perf.md) — before measuring page CPU, blaming compositing, or debugging Canvas 2D artifacts.
- [Nix packaging](nix_packaging.md) — only when packaging a Go binary via `buildGoModule`, or pinning an external binary into a flake profile.

## Cross-references

- Project-tier memory: `<project>/.agents/x-memory/index.md`
- Machine-only memory: `~/.local/share/agents/x-memory/index.md` (read after this router misses)
- Session-history search: `x-memory` CLI (`x-memory query --project <dir>`)
- Curated-memory convention: see shared user-level `AGENTS.md`
