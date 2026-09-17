# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Curated memory (agent-first, human-second)

Working knowledge lives in two untracked Markdown trees, not in a chat transcript:

- **Global tier:** `~/.cache/agents/memory/` — cross-project conventions, preferences, methodology.
- **Project tier:** `<project>/.agents/x-memory/` — project-specific architecture, decisions, pitfalls. Same folder as the `x-memory` session-history index (below) — curated pages and `index.db` live side by side.

Before acting on a topic the wiki covers — naming a branch, writing a commit, picking a library, or any other subtopic a page below documents — open `index.md` at the global path and the project's path first. Treat each `index.md` as a **router**, not a summary: read it, follow the link matching the topic, skip the rest. This applies at every topic switch, not only at session start. The global tree is gitignored by default — personal working memory, never committed unless explicitly opted in; the project tree lives inside `.agents/x-memory/`, also gitignored.

`x-memory` (this repo's `x-memory/` directory) also drives the project folder's session-history index: it recovers what happened in past sessions via the CLI (`x-memory index|query --project <dir>`). The wiki preserves judgment that re-reading transcripts cannot reliably reproduce; x-memory surfaces leads to verify. Use both: x-memory to find prior context, the wiki to record what was learned.

### Writing to the wiki

Never write to the wiki silently — see the `x-memory-curate` skill for
write triggers, classification, and how to keep this bootstrap file
lean before writing anything to `.agents/x-memory/` or the global wiki.

### Domain modeling namespacing

`domain-modeling` skill's `CONTEXT.md` / `docs/adr/` root under `.agents/`
(`.agents/CONTEXT.md`, `.agents/docs/adr/`), never at repo root — keeps
agent-owned files in one tree instead of a second, root-level "agents"
lookalike.

## Session memory (x-memory)

The session-history index lives in `x-memory/spec/` (start at `x-memory/spec/README.md`) and is exposed via the `x-memory` binary (`x-memory index|query|reject|pin --project <dir>`). Claude Code and opencode discover prior sessions through their own native conventions, plus the `x-memory-recall` skill (on-demand deep recall). The startup breadcrumb is the only automatic injection point; full recaps are on demand.

## Workflow

- Every wiki topic (branch naming, commit/PR shape, jest worker cap, npm allowScripts, Bun/TS conventions, code-style ordering, x-memory reindex): handled by the `x-conventions` skill — a plain `index.md` pointer read once at session start proved unreliable, tested empirically (`.agents/x-research/1-model-capability-vs-framing.md`, `2-generalize-to-whole-wiki.md`).
- Fewest files, shortest diff, reuse before invention. No unrequested abstractions.
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- Any new local skill/command/agent gets an `x-` prefix — marks it as ours vs a plugin's, not just on name collision.
- Load `mattpocock-skills:writing-for-agents` before writing or editing any skill file.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
- Substance over praise: skip compliments that lack depth. Engage critically — question assumptions, name biases, offer counterpoints, disagree when warranted. Ground agreement in reason and evidence, not politeness. Under hypothesis ambiguity, seek discriminating evidence; treat contradiction as information about the model, not an obstacle to route around.
