# Memory index (global)

This file is a **router**, not a summary. Read it once, follow the links that
match the current task, skip the rest. Do not read every page on every turn.

Add a page below only when there is something worth preserving. Prefer
extending an existing page over creating a new one.

Pages here are tracked in the public dotfiles repo
(`agents/.config/agents/x-memory/`). Pages marked *local* live outside the
repo in `~/.local/share/agents/x-memory/`, on this machine only: anything holding
secrets, fingerprints, hostnames or private project detail goes there.

## Pages

- [Bun + TypeScript project preferences](bun_typescript.md) — only when working on a Bun/TypeScript project.
- [Code style preferences](code_style.md) — before writing any comment, and for general conventions (alpha ordering, branch/PR shape, CI pinning, config validation, Intl for user-facing formatting) that apply across projects unless opted out.
- [x-memory CLI usage](x-memory-tool.md) — only when a query returns empty and staleness is suspect.
- [Testing preferences](testing.md) — jest CPU/worker cap, before running any jest-backed test command.
- [npm preferences / quirks](npm.md) — allowScripts advisory-only status, before relying on npm's script-approval mechanism.
- [Git / PR workflow preferences](git_workflow.md) — before naming a branch, committing, or opening a PR.
- [SSH signing / hardware key](~/.local/share/agents/x-memory/ssh_signing.md) *local* — before any git commit/fetch/push in these repos, or when signing fails with "incorrect passphrase".
- [Secrets: ask, never extract](secrets.md) — before reading any credential/token/config store, and the moment a task is blocked on a missing or tool-blocked credential (API token, key, password). Ask, never hunt.
- [Agent security incidents](incidents.md) — before loosening any guard (deny pattern, permission, hook), and when a guard blocks you and the next move feels like a workaround.
- [Delivery / orchestration methodology](delivery_methodology.md) — before orchestrating multi-step work, delegating to subagents, or choosing task granularity/sequencing.
- [Jev / Laya decision models](~/.local/share/agents/x-memory/jev_decision_models.md) *local* — before building anything that calls the Jev/Laya Decisions APIs, or routing agent decisions through a decision model.
- [opencode plugin API version gotchas](opencode_plugins.md) — before writing or wiring any opencode plugin or hook.
- [omp (oh-my-pi)](~/.local/share/agents/x-memory/omp.md) *local* — when configuring or debugging omp/oh-my-pi settings or approvals.
- [Nix packaging](nix_packaging.md) — only when packaging a Go binary via `buildGoModule`, or pinning an external binary into a flake profile.

## Cross-references

- Project-tier memory: `<project>/.agents/x-memory/index.md`
- Session-history search: `x-memory` CLI (`x-memory query --project <dir>`)
- Curated-memory convention: see shared user-level `AGENTS.md`
