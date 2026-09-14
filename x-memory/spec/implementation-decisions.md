# Implementation Decisions

## Seam

The single seam this feature is tested at is the **reducer**: a pure `(state, action) => state` function with no I/O, no DOM, no process access. Everything else — the Claude Code hook scripts, the opencode plugin, the CLI wrapper — is a thin shell that reads input, dispatches an action, and writes output. This seam already exists and was validated: a throwaway logic prototype (an HTML free-play/walkthrough demo, and a Bun CLI twin of the same reducer) pushed it through six scenarios before any real hook-wiring code was written. That prototype is the primary source for the shape below, not a new design.

## Module: the reducer

**Superseded by [[docs/adr/0001-pull-based-indexing-over-push-based-capture]].** The reducer below reflects the current pull-based design. An earlier revision of this section described a push-based reducer (`START_SESSION`/`OBSERVE`/`END_SESSION`/`CRASH` actions building up x-memory's own append-log of recap entries) that was validated by prototyping before the pull-based approach was chosen — the prototype's *value* (proving the staleness/scoping logic and finding the two now-moot defects) still stands, but its state shape does not carry forward as-is.

Revised again for [[#two-tier-scope|two-tier scope]]: a flat, single table filtered by column, not a nested per-project object — this is both the more natural SQLite/FTS5 shape and directly what was asked for ("filter table by project"). Described here as a field list, not a schema definition — no code in this spec, only the shape of the decision.

One row per indexed unit of source content, with these fields:

- `id` — row identity.
- `scope` — `project` or `global`, see [[#two-tier-scope|two-tier scope]].
- `project` — the git root the entry is scoped to, or originated from if global.
- `source_tool` — `claude-code` or `opencode`.
- `source_session_id` — the opaque id from the source tool, resolved back through its own stable API, never a raw file path.
- `session_modified_at` — when the *source session itself* last changed, per the source tool. Drives the staleness flag and "what's current."
- `created_at` — when *this row* was first indexed, distinct from the field above. A session can be indexed long after it happened (e.g. the first time x-memory ever runs against an old project), so "how long ago did the work happen" and "how long has x-memory known about it" are genuinely different questions — the first matters for staleness, the second for debugging the index itself and for [[#pruning-policy|pruning]].
- `extracted_text` — the text indexed for full-text search; not the source of truth, just what FTS5 searches over.
- `rejected` — see [[#correcting-a-wrong-recap|correcting a wrong recap]].
- `pinned` — see [[#pinning-a-fact|pinning a fact]].

Alongside the table: an FTS5 index over `extracted_text`, and a watermark (last-indexed timestamp) tracked per `(scope, project, source_tool)` so `index` only has to ask the source tool for what changed since last time, not rescan everything.

Actions, named here by what they do rather than as a literal API: `index(tool, project)` — reads the source tool's stable API for sessions modified since the watermark, extracts and stores searchable text, advances the watermark; dispatched when a new session starts, not on any write-side event from the source session. `query(project, scope, search_term)` — read-only, filtered by `project` (and `scope`, when the caller wants global-only or project-only); with a `search_term`, returns ranked matches (see [[#ranking-old-entries-out-of-relevance|ranking old entries out of relevance]] for how "ranked" avoids old-but-keyword-matching noise); without one, returns the single newest non-`rejected` entry's compressed recap, plus a staleness flag derived from `session_modified_at`. `reject(entry)` / `pin(entry)` — see below.

This is a decision-preserving description, not the literal schema to ship; field names may shift once real API payloads are wired in, but the shape — one flat, project-filterable table, two independent timestamps, built from source-tool reads rather than x-memory's own captured writes — is the validated part.

## Ranking old entries out of relevance

A real gap in an earlier revision: FTS5 relevance ranking alone has no sense of time. A `search_term` query has no defense against an old, superseded entry that happens to share keywords with the current situation outranking a more recent, more relevant one — the literal thing [[glossary#staleness|staleness]] was meant to guard against, but staleness as designed so far only *flags* a result after retrieval, it doesn't affect which results get retrieved or how they're ordered.

The fix: `query` combines FTS5's relevance score with a recency factor derived from `session_modified_at` before ranking results, not just before displaying them — an old entry needs to be substantially more relevant, not just tied, to outrank a recent one. This is a lightweight re-rank, not the confidence/decay/reinforcement machinery rejected earlier from `hippo-memory` and `agentmemory` (see [[lessons-from-alternatives]]) — no persisted confidence score, no scheduled sweep, just relevance and recency combined at query time, recomputed fresh every time rather than decayed in the background. The single-newest-entry path (`query` with no `search_term`) already avoids this problem entirely by construction, so this only matters for keyword-searched queries.

## Two-tier scope

Two kinds of entries share the same table (see the schema above), distinguished by `scope`:

- **Project-scoped**: this project's own session history — what x-memory has focused on throughout this spec.
- **Global-scoped**: conventions and findings that apply across every project — code style, git hygiene, general methodology. Modeled on the same shape as Claude Code's own native per-project memory convention, extended to a second, cross-project tier, the way the user described wanting it framed.

Both are queried through the same `query` action; a caller asking about "this project" gets project-scoped results plus any relevant global entries, while a caller specifically asking "what's my general convention here" can filter to global-scoped entries only. Global entries are not exempt from [[#correcting-a-wrong-recap|rejection]] or [[#pinning-a-fact|pinning]] — a wrong cross-project assumption should be just as correctable as a wrong per-project one.

## Storage

**Revised by [[docs/adr/0001-pull-based-indexing-over-push-based-capture]].** SQLite, using its built-in FTS5 full-text-search module — not a plain-JSON store as an earlier revision of this spec decided, and not `sqliteai/sqlite-memory` either.

The reasoning changed because the job changed. The original storage decision (plain JSON, atomic write-temp-then-rename) was made when x-memory's own store was the source of truth for one short recap per project — correctly reasoned, for that job, that a database bought nothing. Under the pull-based design, x-memory's store is a derived, rebuildable **index** (see [[glossary#index|index]]) over an unbounded, growing amount of text extracted from other tools' session histories, and needs actual search over that text — exactly the job full-text search exists for. SQLite's FTS5 module ships inside SQLite itself; Bun's `bun:sqlite` uses it with no separate extension, no embedding model, and no API key, keeping the same zero-network, zero-cost-by-default posture as the original decision — the tool changed, not the constraint it has to satisfy.

`sqliteai/sqlite-memory` was checked directly and is still the wrong tool: it's a hybrid vector+FTS5 semantic-search engine requiring either a bundled embedding model or a remote API key, plus a hard dependency on a separate `sqlite-vector` extension — built for relevance-ranked search over large free-text corpora with fuzzy/semantic matching, not the keyword/full-text search FTS5 alone already covers here. It also turned up its own due-diligence flag worth remembering as a pattern: its README claims MIT, but the actual `LICENSE.md` is Elastic License 2.0 (non-OSI for closed use) — another instance of a tool's own claims about itself not matching its source, same lesson as [[alternatives-evaluated]]. Verdict: plain SQLite+FTS5, no `sqlite-memory`, no vector search, no embedding dependency.

Because the index is derived and rebuildable, its own durability is a low-stakes concern — a corrupted or lost index file is an inconvenience (rebuild by re-running `index` from the watermark, or from scratch), never data loss, since it never held the only copy of anything.

## Project resolution

`git rev-parse --show-toplevel`, falling back to the raw cwd when not inside a git repository. This is the [[glossary#project|project]] key used both to store and to look up a recap.

## Crash resilience and concurrent-write resolution — both moot

**Superseded by [[docs/adr/0001-pull-based-indexing-over-push-based-capture]].** Earlier revisions of this spec spent real effort on both of these as defects to fix: crash-loss (confirmed by prototyping and independently re-confirmed in a live `hippo-memory` trial) and concurrent-overwrite (same). The fixes on record at the time — incremental observation flushing keyed to Claude Code's `PostToolUse`, and a `status`/`supersededBy` versioning scheme borrowed from `hippo-memory` — were real, working designs, not abandoned for being wrong, but for solving a problem that dissolved once the underlying architecture changed.

Both defects were artifacts of x-memory owning a write path at all. Once x-memory reads from each tool's own already-durable session storage instead of capturing its own copy as sessions happen:

- **There is nothing to lose to a crash.** Claude Code's transcript writes were confirmed, empirically, to be incremental and durable regardless of how the session ends (see the ADR's evidence section). opencode's are more strongly durable still — genuine event-sourcing into SQLite under WAL journaling. [[user-stories#9|Story 9]] is satisfied by construction.
- **There is nothing to race over.** Two sessions on the same project, one per tool, each write to their own tool's own storage. There's no shared mutable field for a second write to clobber. "Current" is just whichever source session has the newer `session_modified_at` — a plain comparison, not a status-tracking scheme.

Both are recorded here, not silently deleted from the spec's history, because a future reader re-discovering the crash-loss or concurrent-write questions should find out they were already investigated and resolved architecturally — not re-derive the same append-log/supersession design from scratch.

## Correcting a wrong recap

An indexed session can still produce a wrong-feeling recap — a tool call that looks more significant than it was, an extracted snippet taken out of context. The mechanism, adapted from `hippo-memory`'s reject flow (see [[lessons-from-alternatives#reject-veto-a-wrong-fact-from-hippo-memory|lessons from alternatives]]), now operates on the index rather than on a write path: marking an entry's `rejected` field (see the field list above) excludes it from `query`'s result immediately, and re-indexing the same underlying session later does not un-reject it — the rejection is keyed to the source session id, not to x-memory's own copy of the text, so a stale index rebuild can't quietly resurface what was already dismissed.

## Pinning a fact

An entry can have its `pinned` field set, only by explicit user action. A pinned entry is exempt from staleness scoring entirely — it's never shown with the staleness caveat from [[user-stories#12|story 12]], regardless of how old the underlying session is. Still a one-field addition, not a new subsystem.

## Pruning policy

Because the index is derived and rebuildable (see [[#storage|storage]]), the stakes here are much lower than an earlier revision of this section assumed for an append-only, non-rebuildable recap log. Old, superseded index entries can simply be dropped from the local SQLite file on an ordinary schedule or size threshold — there is no risk of losing anything the source tool doesn't already durably hold, and worst case a dropped entry just gets re-indexed the next time it's queried. No decay curve, no confidence scoring, no explicit prune command needed to avoid accidental data loss the way the original (pre-ADR) design required — though a manual "rebuild the index" command is still worth having for debugging, per [[user-stories#21|story 21]].

## Storage locations

Two physical SQLite files, matching the two [[#two-tier-scope|scopes]] and following this repo's own already-established naming convention (the `agents` package this dotfiles repo already uses for cross-tool skill sharing, not a name invented for x-memory):

- **Project tier**: `.agents/x-memory/index.db` at the project's git root. Derived and rebuildable — not committed to git (the project root's `.agents/` is already covered by the global `~/.gitignore_global`'s `.agents` rule). **Revised 2026-09-14: the companion curated-memory wiki was originally a separate sibling folder, `.agents/memory/`, kept apart specifically so x-memory's own writes could never clobber hand-curated content.** User decision merged it into the same `.agents/x-memory/` folder as `index.db` instead (see the shared user-level `AGENTS.md` "Curated memory" section) — accepting that overwrite-risk tradeoff explicitly. The index tool itself only ever touches `index.db` by path (see `project.ts`'s `indexDbPath`), so it won't scan or mutate the `.md` pages sitting beside it; the risk is future tooling (a prune/rebuild command) growing careless about what else lives in that folder, not today's code.
- **Global tier**: `~/.config/agents/x-memory/index.db` was the planned location; the live implementation uses `~/.cache/agents/memory/` for the curated wiki and `~/.cache/x-memory/` for the SQLite index, both under the XDG cache root so neither is git-tracked. The stow-managed-directory wrinkle from [[further-notes#global-storage-lands-inside-a-stow-managed-directory|further notes]] is therefore moot.

Both SQLite files use the same schema (see the table above); `scope` and `project` columns distinguish rows within each file, and a query that needs both (project history plus applicable global conventions) reads from both files rather than one being a subset of the other.

## Staleness threshold

The number itself, not just the mechanism (see [[#ranking-old-entries-out-of-relevance|ranking old entries out of relevance]] and the [[glossary#staleness|staleness]] flag): `hippo-memory`'s per-memory half-life, live-verified at a 7-day default, is worth taking as the starting real value rather than inventing a new one. A stale recap is still returned — never silently withheld — but annotated so it's trusted at reduced confidence, per [[user-stories#12|story 12]].

## Hook wiring

**Revised by [[docs/adr/0001-pull-based-indexing-over-push-based-capture]]: no write-side hooks are needed at all.** An earlier revision wired `SessionEnd`/`PostToolUse` (Claude Code) and `session.created`/`session.idle`/`session.compacted` (opencode) to capture observations as a session ran. None of that is needed now — each tool already durably records its own session regardless of what x-memory does. The only hooks left are on the read side, triggered when a *new* session starts:

**Revised again per [[retrieval-use-cases]]: `SessionStart`/`chat.system.transform` inject a one-line breadcrumb, not a recap.** An earlier revision of this section had the read-side hook run `index` then `query` and inject the full compressed recap automatically on every session start. That was pushing too much, too early, against the user's explicit "bare minimum at startup" requirement — a full recap presumes the new session needs it, when most of the time the agent should decide that based on what the user actually asks. `query` is now an explicit tool the agent calls when it judges a user message references prior work (see [[retrieval-use-cases#the-two-retrieval-moments|the two retrieval moments]]), not something dispatched automatically at every session start.

**Claude Code**: `SessionStart` hook dispatches `index` (cheap, for the *other* tool's sessions on this project) and injects a one-line breadcrumb — session count and recency, nothing else — via the hook's `additionalContext` output field. `query` is exposed separately (an MCP tool or a Skill the agent invokes) for the agent to call on demand. Configured in `settings.json`, verified as the real, documented mechanism.

**opencode**: no `SessionStart`-equivalent hook exists yet (tracked upstream as issue `#5409` at the time of writing) — the verified, real injection point is `experimental.chat.system.transform`, which pushes the same breadcrumb into `output.system[]` before each LLM call, triggered by `index` on `session.created`. `query` is exposed the same way as on the Claude Code side — an on-demand tool call, not automatic injection. This was chosen over the earlier-considered fallback of rewriting `AGENTS.md` at session start, because it requires no file mutation and carries no risk of clobbering a user-edited file.

The `PreCompact`/compaction-timing question from an earlier revision (whether to capture before or after a long session's own compaction) is no longer a data-loss concern — the full, uncompacted transcript is already durable in the source tool's own storage regardless of when or whether x-memory reads it. It remains relevant only for one thing: keeping the human-reviewable [[glossary#snapshot|snapshot]] fresh during a very long still-running session (see [[further-notes#materializing-snapshots|further notes]]), which is a freshness nicety, not a correctness requirement.

## Reading through stable interfaces (hard constraint)

x-memory never parses either tool's internal session-storage format directly — not Claude Code's JSONL, not opencode's SQLite database. Both are explicitly internal and known to change: Claude Code's own docs warn the JSONL entry format changes across releases and recommend the Agent SDK or `--output-format json` instead; opencode's storage format changed from per-message JSON files to an event-sourced SQLite database during the course of writing this spec, confirmed directly in its source's own `MIGRATIONS` array — a live example of exactly the risk being guarded against, not a hypothetical one. `index` reads through each tool's stable surface only: Claude Code's Agent SDK (`get_session_messages()`, `list_sessions()`) or `claude --resume <id> --output-format json`; opencode's `session list --format json` / `export`.

## Compressed response, not a session dump

`query`'s default output is extractive: FTS5-ranked matching snippets from the index, assembled into a short recap — no LLM call, no network, no API key required, keeping the same zero-cost default as everything else in this spec (see [[out-of-scope]]). An LLM-synthesized summary is a legitimate future opt-in enhancement (the same shape as `hippo-memory`'s bring-your-own embeddings — off by default, better if the user configures it), never the default path.

## Materializing snapshots

**Superseded — see [[archived-threads#materializing-snapshots-superseded|archived threads]].** Replaced by the curated `.agents/memory/` wiki convention in the shared user-level `AGENTS.md`. The auto-regenerated `snapshot.md` file is gone; `snapshot.ts` / `snapshot.test.ts` and the `x-memory snapshot` subcommand were deleted at the same time.

## Scope constraint (hard constraint, not a preference)

Any x-memory operation — not just the installer — touches or reads only: the current project's git-root-relative config, and the user's own `~/.claude/settings.json` / `~/.config/opencode/opencode.json` — nothing else, and nothing outside a directory the user explicitly pointed it at. This covers both writes and reads, and was broadened to reads deliberately: it started as a write-only rule after `hippo-memory`'s `hook install claude-code`, run from an isolated scratch project with its own data-directory override set, ignored that override and silently wrote five hooks into this repo's real, git-tracked `settings.json` anyway, referencing a binary that wasn't even installed. It was broadened after a second, independent incident: `hippo-memory`'s `init --scan`, run in the same kind of isolated scratch setup, still auto-imported content from this machine's real Claude Code memory files into its scratch store — an unrequested *read* across the same kind of boundary. x-memory's installer, its hook shells, and any future "scan"/"import" style command must not be capable of either mistake: any override of the working scope must be absolute, not advisory.

## Naming

Any skill, slash command, or agent name x-memory introduces that collides with an existing one already installed gets an `x-` prefix rather than an unrelated name, per the user's stated convention.
