# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Session memory

Cross-tool session handoff and recall is designed in `x-memory/spec/` (start at `x-memory/spec/README.md`). The pure reducer (`index`/`query`/`reject`/`pin`) is implemented and tested in `x-memory/src/`, but nothing wires it into either tool yet — no hooks, no storage, no CLI. Until that lands there's no automatic cross-tool memory: if you need what happened in the other tool, ask the user.

## Workflow

- Fewest files, shortest diff, reuse before invention. No unrequested abstractions.
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- A new local skill/command/agent whose name collides with an existing one gets an `x-` prefix, never an unrelated name.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
- Claude Code's own per-project memory (`~/.config/claude/projects/<slug>/memory/`) is today's closest living record of durable, project-specific findings — opencode has no equivalent yet.
