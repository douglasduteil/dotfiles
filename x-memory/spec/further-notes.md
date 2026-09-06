# Further Notes

## Open, not yet decided

- Whether x-memory ships as a real npm/Bun package with its own repo, or lives inside this dotfiles repo permanently. Given it's currently speculative (no code written yet, per this spec's own instruction), this can wait until the reducer + read-side hooks actually exist.
- The exact index-refresh cadence for a single very long-running session: `index` is triggered at session start, but should a still-open, hours-long session ever re-index the *other* tool's activity mid-session, or only ever at its own start? A tuning/UX decision, not an architectural one — see [[archived-threads#materializing-snapshots-superseded|archived threads]] for the now-superseded snapshot refresh timing it referenced.
- The exact size/age threshold for dropping old index entries per [[implementation-decisions#pruning-policy|pruning policy]] — low-stakes now that the index is rebuildable, but still a number someone has to pick.

## Superseded during the pivot to pull-based indexing

This section previously recorded two decisions — a `status`/`supersededBy` versioning model for "what's the current recap," and an agentmemory-style decay-then-soft-hide pruning rule for an append-only log — as settled by fact-checking the three rejected tools. Both were real, working answers to real questions at the time. [[docs/adr/0001-pull-based-indexing-over-push-based-capture|The later pivot to pull-based indexing]] removed the questions themselves, not just the answers: without a shared store x-memory writes to, there's no append-log to version or prune in the first place. Recorded here so a future reader finds out these were investigated and superseded, not simply forgotten.

## opencode's storage format changed mid-investigation

Worth remembering as a concrete instance of exactly the risk [[implementation-decisions#reading-through-stable-interfaces-hard-constraint|reading through stable interfaces]] guards against: while investigating this design, opencode's actual session storage turned out to have migrated from the per-message JSON file layout referenced in earlier research (`storage/{session,message,part}/*.json`) to a genuinely event-sourced SQLite database with WAL journaling — found directly in source (`packages/opencode/src/storage/storage.ts`'s `MIGRATIONS` array), not from any changelog announcement. Anything that had been built against the old file paths would have silently broken. See the ADR for the full finding.

The `PreCompact`/compaction-timing question from earlier revisions of this spec (opencode has no pre-compaction hook, only the post-hoc `session.compacted` event) is downgraded from a data-loss risk to a snapshot-freshness nicety by the same pivot — see [[archived-threads#materializing-snapshots-superseded|archived threads]] (the snapshot section it referenced is itself now superseded by the curated `.agents/memory/` wiki).

## Global storage lands inside a stow-managed directory

**Moot — see [[implementation-decisions#storage-locations|storage locations]].** The curated wiki lives at `~/.cache/agents/memory/`, the SQLite index at `~/.cache/x-memory/`, both under the XDG cache root. Neither path goes through the stow-managed `~/.config/agents` symlink, so the "cache file swept into version control" risk that originally motivated this note no longer applies. Kept here as a record of the wrinkle the new layout deliberately avoids.

## Others have already noticed this exact gap

While confirming that opencode has no native awareness of Claude Code's memory conventions, two small third-party bridge plugins turned up that exist specifically to patch it: `kuitos/opencode-claude-memory` and `mc303/claude-mem-opencode`. Neither was investigated in depth (out of scope for this pass), but their existence is itself evidence worth recording: this isn't a hypothetical problem being solved speculatively, it's one at least two other people independently built a patch for.

## Relationship to existing memory conventions

**Superseded — see [[archived-threads#related-open-thread-also-superseded|archived threads]].** The "revisit in a future spec" question it raised is now answered: the format lives in `.agents/memory/` (shared user-level convention in `AGENTS.md`), not inside Claude Code's private `~/.claude/projects/<slug>/memory/`. The reasoning against writing into that private directory still stands and is preserved verbatim in the archive.
