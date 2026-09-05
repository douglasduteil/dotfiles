---
status: accepted, supersedes the push-based design in earlier revisions of implementation-decisions.md
---

# Index each tool's own durable session storage on demand, instead of capturing writes as sessions happen

x-memory's first design pushed: hooks fired on every significant event during a session (`PostToolUse` observations, a `SessionEnd` write) to build up a recap x-memory itself owned. That design existed to solve two defects found by prototyping — crash-loss and concurrent-overwrite — both of which turned out to be artifacts of x-memory owning the write path at all, not inherent to the problem.

We decided instead to pull: both Claude Code and opencode already write their own session history incrementally and durably, independent of anything x-memory does, and x-memory can read that history on demand (at the point a new session starts, or on an explicit query) rather than racing to capture it live. This was verified empirically, not assumed — see below.

## Considered options

1. **Push (original design)**: x-memory hooks fire during the source session, writing its own recap store as the session goes. Rejected because it inherits every reliability quirk of the *source* tool's session-lifecycle hooks (Claude Code's own docs say `SessionEnd` isn't guaranteed on signal-based termination — closing a terminal, Ctrl-C) and requires x-memory to solve concurrent-write conflicts on its own mutable store, both of which needed non-trivial fixes (append-log, `status`/`supersededBy` bookkeeping) documented in earlier revisions of [[../implementation-decisions|implementation decisions]].
2. **Pull (chosen)**: x-memory reads each tool's own already-durable session storage, indexing it on demand. No write-side hook is needed from x-memory at all; the only hook left is on the read side, to trigger indexing and injection when a *new* session starts.

## Evidence

- Claude Code: confirmed empirically, not from docs alone. The live transcript of the actual session this decision was made in already contained content from far earlier in the conversation — before any clean session end — proving the JSONL transcript is written incrementally in real time, not buffered until exit.
- opencode: confirmed from source. Current opencode (the `storage/{session,message,part}/*.json` layout referenced in earlier revisions of this spec is a **superseded, migrated-away-from format** — see `packages/opencode/src/storage/storage.ts`'s `MIGRATIONS` array) now persists sessions via genuine event-sourcing into SQLite (`~/.local/share/opencode/opencode.db`): every event is written inside a `BEGIN IMMEDIATE` transaction before being projected, under WAL journaling, which is specifically safe for concurrent reads while a writer is active.

## Consequences

- The crash-resilience defect (see the superseded reasoning still recorded in [[../implementation-decisions|implementation decisions]]'s edit history / this spec's own prior revisions) is moot: there is no capture step of x-memory's own to lose. [[../user-stories#9|Story 9]] is now satisfied by construction, not by a mechanism.
- The concurrent-write defect is moot for the same reason: there is no shared mutable store two sessions race to write. Each tool already isolates its own sessions in its own storage. The `status`/`supersededBy` model adopted from `hippo-memory` in an earlier revision is no longer needed — "current" is simply "the most recently modified session for this project," which the source tool already tracks.
- x-memory's own storage changes role: from being the source of truth for recap content, to being a **derived, rebuildable index** (pointers plus extracted searchable text) over data it doesn't own. This lowers the stakes on x-memory's own storage durability — worst case, the index is rebuilt from source — and reopens SQLite as a legitimate choice specifically for full-text search over that index (via SQLite's built-in FTS5, not a vector-search extension), which was rejected in an earlier pass for a different, no-longer-applicable reason (storing one small structured recap didn't need a database; indexing arbitrary multi-session text for search does).
- A new constraint follows directly from the evidence above: x-memory must read through each tool's stable, documented interfaces (Claude Code's Agent SDK `get_session_messages()`/`list_sessions()`, opencode's `session list --format json`/`export`), never by hand-parsing the underlying JSONL or SQLite file formats directly — both are explicitly internal and already confirmed to change across versions (opencode's own recent format migration is a live example of exactly this risk).
- x-memory now has essentially no write-side hook surface. The only hook it needs is on the read side (`SessionStart` in Claude Code, `chat.system.transform` in opencode), triggered when a new session starts, to index-if-stale and inject.
