# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode, omp) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Constitution

Binding on every session and subagent; outranks everything below. Single source: `~/.config/agents/rules/constitution.md` (omp loads it as an always-apply rule; Claude Code imports it here; opencode lists it in `instructions`).

@~/.config/agents/rules/constitution.md

## Memory: four places to look

Working knowledge lives in three wiki tiers plus a session index, not in a chat
transcript. Check them in this order, at every topic switch, not only at session
start:

1. **Project** — `<project>/.agents/x-memory/` (gitignored): architecture, decisions, pitfalls for this repo, beside its own session index.
2. **Global** — `~/.config/agents/x-memory/`: cross-project conventions, preferences, methodology, published with this dotfiles repo — write every page as a public blog post anyone may read.
3. **Local** — `~/.local/share/agents/x-memory/`, this machine only, never tracked: anything carrying a secret, key fingerprint, hostname, drive letter or private repo name, routed by its own `index.md`.
4. **Session history** — what actually happened, via the `x-memory` binary (`index|query|reject|pin --project <dir>`). It indexes Claude Code, opencode and omp sessions; the `x-memory-recall` skill goes deeper on demand. At session start the host injects both router pages plus a one-line breadcrumb; page bodies are read on demand.

Where a tier has an `index.md`, it is a **router**, not a summary: read it, follow
the single link matching the topic, skip the rest. The global one is public, so it
lists only publicly openable pages. The wiki preserves judgment a transcript cannot
reproduce; a session-history hit stays a lead until re-verified against its source.

That separation is what keeps the global tier publishable.

Write to a tier through the `x-memory-curate` skill, never silently: it owns
the triggers, the classification and the draft-first rule.

### Domain modeling namespacing

`domain-modeling` skill's `CONTEXT.md` / `docs/adr/` root under `.agents/`
(`.agents/CONTEXT.md`, `.agents/docs/adr/`), never at repo root — keeps
agent-owned files in one tree instead of a second, root-level "agents"
lookalike.

## Workflow

- Every wiki topic (branch naming, commit/PR shape, jest worker cap, npm allowScripts, Bun/TS conventions, code-style ordering, x-memory reindex): handled by the `x-conventions` skill — a plain `index.md` pointer read once at session start proved unreliable, tested empirically (`.agents/x-research/1-model-capability-vs-framing.md`, `2-generalize-to-whole-wiki.md`).
- Fewest files, shortest diff, reuse before invention. No unrequested abstractions.
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- Any new local skill/command/agent gets an `x-` prefix — marks it as ours vs a plugin's, not just on name collision.
- Load `mattpocock-skills:writing-for-agents` before writing or editing any skill file.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
- Substance over praise: skip compliments that lack depth. Engage critically — question assumptions, name biases, offer counterpoints, disagree when warranted. Ground agreement in reason and evidence, not politeness. Under hypothesis ambiguity, seek discriminating evidence; treat contradiction as information about the model, not an obstacle to route around.
