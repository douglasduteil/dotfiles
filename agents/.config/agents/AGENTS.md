# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Curated memory (agent-first, human-second)

Working knowledge lives in two untracked Markdown trees, not in a chat transcript:

- **Global tier:** `~/.cache/agents/memory/` — cross-project conventions, preferences, methodology.
- **Project tier:** `<project>/.agents/memory/` — project-specific architecture, decisions, pitfalls.

On session start, look for `index.md` at the global path and at the project's path. Treat each `index.md` as a **router**, not a summary: read it, follow links relevant to the task, skip the rest. Both trees are gitignored by default — they are personal working memory, never committed unless explicitly opted in.

`x-memory` (this repo's `x-memory/` directory) sits underneath as a session-history index: it recovers what happened in past sessions via the CLI (`x-memory index|query --project <dir>`). The wiki preserves judgment that re-reading transcripts cannot reliably reproduce; x-memory surfaces leads to verify. Use both: x-memory to find prior context, the wiki to record what was learned.

### Writing to the wiki

Never write to the wiki silently — see the `x-curate-memory` skill for
write triggers, classification, and how to keep this bootstrap file
lean before writing anything to `.agents/memory/` or the global wiki.

### Domain modeling namespacing

`domain-modeling` skill's `CONTEXT.md` / `docs/adr/` root under `.agents/`
(`.agents/CONTEXT.md`, `.agents/docs/adr/`), never at repo root — keeps
agent-owned files in one tree instead of a second, root-level "agents"
lookalike.

## Session memory (x-memory)

The session-history index lives in `x-memory/spec/` (start at `x-memory/spec/README.md`) and is exposed via the `x-memory` binary (`x-memory index|query|reject|pin --project <dir>`). Claude Code and opencode discover prior sessions through their own native conventions, plus the `x-memory-recall` skill (on-demand deep recall). The startup breadcrumb is the only automatic injection point; full recaps are on demand.

## Workflow

- Fewest files, shortest diff, reuse before invention. No unrequested abstractions.
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- Any new local skill/command/agent gets an `x-` prefix — marks it as ours vs a plugin's, not just on name collision.
- Load `mattpocock-skills:writing-for-agents` before writing or editing any skill file.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
