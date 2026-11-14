# DeepSeek aliases on OpenRouter (cheap/fast tier)

Normative (user decision 2026-10-27): `~deepseek/deepseek-flash-latest` is
the standard cheap/fast tier for agent work — omp read-only subagents
(`task.agentModelOverrides`, see the local `omp.md` page) and the opencode
default model. The `~` prefix is OpenRouter's vendor-prefixed floating
alias: it tracks DeepSeek's newest flash/pro revision automatically.

Tradeoffs accepted with that choice:

- **Silent drift.** When DeepSeek ships a revision, behavior changes with
  no config diff. Fine for scouts/exploration; when bisectability matters
  (edit agents, reproducible checks), pin instead — e.g.
  `deepseek/deepseek-v4-flash-0731`.
- **Alias pricing can be blended or stale.** omp's catalog showed
  `~pro-latest` at $8/M output while the pinned `v4-pro-0813` row is
  $1.98/M. Verify real spend on a first dispatch before trusting a
  catalog number.
- Exploration is output-heavy (transcripts, file:line tables), so the
  in/out price ratio matters more than input price when picking the tier.
- Pro tier buys nothing for location/scout work; escalate per-slice, not
  by default.

## Routing an edit to the cheap tier (omp 18.18.9, verified 2026-11-13)

Descriptive.

- The bundled `sonic` agent resolves the `smol` model role, so it is the
  route for mechanical edits on the cheap tier. The generic `task` agent
  stays on the main model unless `task.agentModelOverrides.task` names a
  role or `task.prewalk` hands off to `@smol` at the first edit.
- A per-call `model` on `task` fails preflight while
  `task.perCallModel: off` (the shipped default).
- Proof of what ran is the subagent transcript's `session_init` model,
  never the agent's own answer: asked for its model id, a `sonic` worker
  replied with its agent name.
