# Agents

Bootstrap notes for any AI coding agent (Claude Code, opencode, omp) working in this repo, or any repo this user touches. Keep this short — it's a signpost, not a manual. Edit it directly; it's a plain tracked file, not generated.

## Constitution

Binding on every session and subagent; outranks everything below. Single source: `~/.config/agents/rules/constitution.md` (omp loads it as an always-apply rule; Claude Code imports it here; opencode lists it in `instructions`).

@~/.config/agents/rules/constitution.md

## Memory

The four tiers, the lookup order, the router convention, and the `x-memory-curate` skill: see `x-memory-tool.md` in the global wiki.

### Domain modeling namespacing

`domain-modeling` skill's `CONTEXT.md` / `docs/adr/` root under `.agents/`
(`.agents/CONTEXT.md`, `.agents/docs/adr/`), never at repo root — keeps
agent-owned files in one tree instead of a second, root-level "agents"
lookalike.

## Code navigation

Work symbol-first on TypeScript where the harness provides it: language-server definitions, references, diagnostics, and rename before editing a symbol; AST search and edit tools when enabled, text search only for literals, config, and non-code files. omp's exact tool names live in its `RULES.md`.

## Workflow

- Every wiki topic (branch naming, commit/PR shape, test proof order and jest worker cap, npm allowScripts, Bun/TS conventions, code-style ordering, x-memory reindex): handled by the `x-conventions` skill — a plain `index.md` pointer read once at session start proved unreliable, tested empirically (`.agents/x-research/1-model-capability-vs-framing.md`, `2-generalize-to-whole-wiki.md`).
- Apply `x-lazy` (what to build) and `x-terse` (how to reply) to every response from the first turn; load each once per session. Drop one only when the user says "stop lazy" / "stop terse" / "normal mode".
- Skills live in one canonical place: `~/.config/agents/skills/`. Don't duplicate one, extend or reuse it.
- Any new local skill/command/agent gets an `x-` prefix — marks it as ours vs a plugin's, not just on name collision.
- Where an `x-` skill or a wiki page conflicts with a plugin skill (`tdd`, mattpocock), ours wins. The repo's own config and history still win over both.
- **Proof order: types first, tests last.** Each claim goes on the first rung that holds it, and a *unit* test is the rarest rung. The ladder lives in `testing.md` (global wiki): read it before writing, planning or reviewing a test, and whenever `tdd`, `implement`, `diagnosing-bugs` or `codebase-design` asks for one; it overrides their test defaults by name.
- Load `mattpocock-skills:writing-for-agents` before writing or editing any skill file.

## User preferences

- Don't take a recalled or remembered fact as settled truth. Confirm before acting on anything non-trivial, especially if it's more than a few days old.
- Substance over praise: skip compliments that lack depth. Engage critically — question assumptions, name biases, offer counterpoints, disagree when warranted. Ground agreement in reason and evidence, not politeness. Under hypothesis ambiguity, seek discriminating evidence; treat contradiction as information about the model, not an obstacle to route around.
