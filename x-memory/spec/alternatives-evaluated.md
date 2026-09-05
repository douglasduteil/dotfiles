# Alternatives Evaluated

Before designing x-memory, three existing tools claiming to solve this or something adjacent were investigated and, where feasible, actually installed and exercised live — not just read about. This page is the primary-source record, so the same ground doesn't get re-covered in a future session.

## agentmemory (`rohitg00/agentmemory`)

npm CLI (`@agentmemory/agentmemory`), Apache-2.0. Embeds a generic third-party "iii-engine" serverless runtime (workers, queues, pub/sub, triggers) as its execution substrate, backing a REST API, SQLite state store, and OpenTelemetry pipeline across three local ports.

- **Credibility problem**: the repo was created 2026-02-25 and already shows ~28,000 stars / 2,425 forks within roughly six months — the same signature independently confirmed on two names in agentmemory's own "competitor comparison" table (`MemPalace`, `TencentDB-Agent-Memory`), one of which has a separately documented, retracted benchmark scandal. This doesn't prove the code is bad, but it means agentmemory's self-reported recall benchmarks and "actively maintained" framing should not be trusted at face value.
- **Live-verified defaults**: context injection is **off by default** (the actual handoff/recap behavior this project needs does not happen out of the box; enabling it carries an explicit cost warning about draining API allocation faster). Recall quality without a paid embedding key degrades to keyword-only (BM25), missing semantically-related, keyword-different content in a live demo run.
- **Environment friction**: the bundled native `iii` binary does not run on NixOS at all (missing dynamic linker paths) until wrapped with `steam-run`; the documented Docker fallback also failed on this machine because its `docker` is actually a podman-compose shim with incompatible argument parsing, requiring manual container cleanup.
- **Was actually wired in, then fully removed**: `connect claude-code`/`connect opencode` were run for real, adding an MCP server entry to `~/.claude.json` and `~/.config/opencode/opencode.json`. Both entries and the installed binary were later removed as part of moving on to evaluate other options.
- **Verdict**: real project, disproportionate machinery (a full serverless engine) for what should be a small store-and-recall job, and a popularity signal that just failed a credibility check.

## supermemory (`supermemoryai/supermemory`)

The core repo itself is legitimate — created 2024-02-27, ~29,000 stars with organic multi-year growth, MIT license, no star-farming signature found.

- **Disqualifying finding**: the actual Claude Code integration (`claude-supermemory`, a separate plugin repo) requires `SUPERMEMORY_CC_API_KEY` from `console.supermemory.ai` — the hosted cloud account — with no documented way to point it at the self-hosted local server instead. The opencode integration is better-behaved (additive plugin registration in `opencode.jsonc`, doesn't clobber existing config) but its handoff mechanism appears to route through the cloud service even when the core server is self-hosted.
- Also requires its own persistent daemon (`supermemory-server` on `localhost:6767`) — the same architectural shape as agentmemory's daemon requirement.
- **Verdict**: legitimate tool, wrong fit — the one feature this project needs (cross-tool handoff) is cloud-gated, which directly contradicts the local-only, no-opaque-dependency requirement.

## hippo-memory (`kitfunso/hippo-memory`)

npm package (`hippo-memory`), MIT, real and current (last push same day as evaluation), no star-farming signature (739 stars with a plausible, honest growth curve) — and unusually transparent, with a changelog entry publicly retracting the maintainer's own overstated benchmark claim after it failed to reproduce.

- **Scope creep, confirmed by actually running `--help`**, not just reading a README summary: policy versioning, customer-account notes, project briefs, an entity/relation graph, a goal-stack modeled on brain regions (`dlPFC`/`vlPFC`/`OFC`, literally referencing "AI Pineal Gland"), API-key auth with roles, an append-only audit log, a web dashboard, and sleep/consolidation cycles — roughly twenty subsystems for what this project needs from three commands (`handoff create`, `session resume`, `hook install`).
- **Live-tested core mechanism, in isolated scratch projects with an overridden data directory**: the basic handoff loop works correctly — `handoff create` in one simulated session is correctly returned by `session resume` in a fresh invocation, and per-project scoping correctly prevented any cross-project leakage.
- **Confirmed the identical crash-loss defect** found in x-memory's own prototype: a `session log` progress event, made without an explicit `handoff create`/`snapshot save`, is invisible to `session resume`, `recall`, `--continuity`, and `status` alike. Worse, `session resume` silently returned the previous, older handoff with no signal that newer, uncaptured work existed — a false sense of being caught up.
- **A genuine safety incident, live-verified**: `hippo hook install claude-code`, run from an isolated scratch test project with `HIPPO_HOME` explicitly overridden to a scratch directory, ignored both the working directory and the override and silently wrote five hooks directly into this machine's real, git-tracked `~/.claude/settings.json` — no scoping, no confirmation, no dry-run offered — referencing a bare `hippo` binary that wasn't even installed globally, which would have silently failed on every future session. This was caught via `git status`/`git diff` immediately after and reverted with `git checkout`.
- One genuine thing worth keeping: a real per-memory half-life/decay mechanism (7-day default), a more principled staleness model than the placeholder threshold used in x-memory's own prototype.
- **Verdict**: the core recall/handoff logic works, and the decay idea is worth borrowing, but twenty subsystems for a three-command job, an unresolved instance of the same crash-loss defect, and a live-confirmed unscoped global-config write together rule it out as something to adopt wholesale.

## sqlite-memory (`sqliteai/sqlite-memory`)

Considered as a possible storage layer, not a competing handoff tool — a real SQLite loadable extension (C, plus a companion Go CLI `sqlmem`) from a real small company (SQLite AI, Inc.), created 2026-01-30, 116 stars with a plausible non-inflated spread across the org's other repos.

- **Wrong category**: it's a hybrid vector-similarity + FTS5 semantic-search engine for ingesting and querying large text corpora, hard-dependent on a separate `sqlite-vector` extension and requiring either a bundled embedding model or a remote API key to function at all. x-memory's actual storage need — one current entry per project, a supersedes-pointer history, a last-N-grouped-by-date query — is exact-key, ordered-list logic with no relevance-ranking requirement. Adopting it would mean pulling in a C extension and an embedding dependency to get a plain key-value store you don't need semantic search on.
- **A due-diligence flag, not a dealbreaker for the tool itself**: its own README claims an MIT license; the actual `LICENSE.md` is Elastic License 2.0 (non-OSI for closed/commercial use). Noted here as the same category of lesson as the rest of this page — verify a project's own claims about itself, including its license, against the actual file.
- **Verdict**: does not change the JSON-files storage decision in [[implementation-decisions#storage|implementation decisions]].

## What this settles

No existing tool does this narrowly, locally, and safely. The due-diligence this page records is what justifies building x-memory rather than adopting one of these — see [[problem-and-solution]] and [[implementation-decisions]] for what gets built instead, and note that the crash-loss and unscoped-write failure modes found here are carried forward as explicit constraints ([[implementation-decisions#crash-resilience|crash resilience]], [[implementation-decisions#config-write-scope-hard-constraint-not-a-preference|config-write scope]]), not just cautionary stories.
