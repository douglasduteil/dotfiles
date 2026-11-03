# x-memory CLI usage

## Lookup order

Before re-deriving a fact, walk the tiers in order and stop at the first hit:

1. **Project wiki** — `<project>/.agents/x-memory/index.md`, then the page it
   routes to.
2. **Global wiki** — `~/.config/agents/x-memory/index.md`, then the page it
   routes to.
3. **Machine-only wiki** — `~/.local/share/agents/x-memory/index.md`, then the
   page it routes to. Key paths, serials, hostnames, drive letters and private
   repo names live here. The folder is machine-local: another machine has its
   own pages there, or none.
4. **Session history** — `x-memory query --project <dir> [--search "<term>"]
   [--scope project|global]`. Returns ranked session leads, each with its
   source tool, id and date.

Done when a page answers the topic, or the question is reduced to session
leads you have opened and read. A lead is not a fact: read the session before
acting on it.

## Coverage (verified 2026-11-03)

Claude Code, opencode and omp are all indexed in one store — `sourceTools` in
`x-memory/src/reducer.ts`. omp publishes no session-list command, so
`x-memory/src/omp_source.ts` reads
`~/.omp/agent/sessions/-<project-basename>/<timestamp>_<uuid>.jsonl` directly.

Index files: project scope is `<project>/.agents/x-memory/index.db`, global
scope is `$XDG_CACHE_HOME/x-memory/index.db` (empty until a global index run
populates it). `pin` and `reject <entry-id>` curate results, both
`--scope`-aware.

## Reindex before trusting an empty result

An empty query is not proof of no history: the index may be stale, or never
built for that project. Run `x-memory index --project <dir>`, then retry.
`--tool` defaults to `claude-code`, so pass `--tool opencode` and
`--tool omp` as well to refresh every source; `--rebuild` discards and
rescans that tool's store.

Design notes for the tool itself live in `x-memory/spec/` (start at
`README.md`).
