# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Curated memory (agent-first, human-second)

Working knowledge lives in two untracked Markdown trees, not in a chat transcript:

- **Global tier:** `~/.cache/agents/memory/` — cross-project conventions, preferences, methodology.
- **Project tier:** `<project>/.agents/memory/` — project-specific architecture, decisions, pitfalls.

On session start, look for `index.md` at the global path and at the project's path. Treat each `index.md` as a **router**, not a summary: read it, follow links relevant to the task, skip the rest. Both trees are gitignored by default — they are personal working memory, never committed unless explicitly opted in.

`x-memory` (this repo's `x-memory/` directory) sits underneath as a session-history index: it recovers what happened in past sessions via the CLI (`x-memory index|query --project <dir>`). The wiki preserves judgment that re-reading transcripts cannot reliably reproduce; x-memory surfaces leads to verify. Use both: x-memory to find prior context, the wiki to record what was learned.

### Writing to the wiki

The agent **never writes silently**. Triggers, in priority order:

1. **Explicit "remember this"** — propose a destination (project wiki, global wiki, existing project docs, or a skill) and a draft; write only on confirm. If the destination is ambiguous, ask.
2. **Session-end / task-finish** — surface 1–N "things worth remembering" with proposed destination and a one-line draft. Accept / reject / edit each; nothing is written without your say-so.
3. **Stacked feedback for later triage** — recurring frictions noted during the session, batched for a single end-of-session review.

**Classification rule:** documentation captures what is true and why; a skill captures a repeatable procedure with a clear trigger. Prefer extending an existing page over creating a new one. When a project-specific lesson keeps recurring across projects, propose promoting it to the global wiki.

**Loading discipline (not just scope):** this bootstrap file is read on *every* session of *every* tool. Anything placed here is loaded whether or not it is relevant to the current task, so it has a real token cost. The wiki tiers solve this: they are *not* loaded by default — the agent reads them only when a task actually touches their topic. Therefore:

- **Keep this file minimal.** Only put here what is universally true across every project, every tool, every session (e.g. the "treat recalled facts as leads" rule, the skill-location convention, the "no unrequested abstractions" rule).
- **Put technology-specific preferences, tool quirks, and accumulated methodology in a topic page** in the global wiki (`~/.cache/agents/memory/<topic>.md`), and link it from the index with a one-line trigger ("only when working on X"). The same applies to project-specific knowledge in the project wiki.
- **Don't paste wiki content into this file** to "make sure it gets seen." A topic page that's never loaded beats a bootstrap entry that's always loaded and usually irrelevant.
- If a global rule keeps recurring as a useful *judgment* in many sessions (not just when working on one technology), it can graduate to a skill; if it only matters in one technology, it stays in that technology's wiki page.

## Session memory (x-memory)

The session-history index lives in `x-memory/spec/` (start at `x-memory/spec/README.md`) and is exposed via the `x-memory` binary (`x-memory index|query|reject|pin --project <dir>`). Claude Code and opencode discover prior sessions through their own native conventions, plus the `x-memory-recall` skill (on-demand deep recall). The startup breadcrumb is the only automatic injection point; full recaps are on demand.

## Workflow

- Fewest files, shortest diff, reuse before invention. No unrequested abstractions.
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- A new local skill/command/agent whose name collides with an existing one gets an `x-` prefix, never an unrelated name.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
