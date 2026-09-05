# Further Notes

## Open, not yet decided

- Whether x-memory ships as a real npm/Bun package with its own repo, or lives inside this dotfiles repo permanently. Given it's currently speculative (no code written yet, per this spec's own instruction), this can wait until the reducer + read-side hooks actually exist.
- The exact index-refresh cadence for a single very long-running session: `index` is triggered at session start, but should a still-open, hours-long session ever re-index the *other* tool's activity mid-session, or only ever at its own start? A tuning/UX decision, not an architectural one — see [[implementation-decisions#materializing-snapshots|materializing snapshots]] for the related (also-open) question of snapshot refresh timing.
- The exact size/age threshold for dropping old index entries per [[implementation-decisions#pruning-policy|pruning policy]] — low-stakes now that the index is rebuildable, but still a number someone has to pick.

## Superseded during the pivot to pull-based indexing

This section previously recorded two decisions — a `status`/`supersededBy` versioning model for "what's the current recap," and an agentmemory-style decay-then-soft-hide pruning rule for an append-only log — as settled by fact-checking the three rejected tools. Both were real, working answers to real questions at the time. [[docs/adr/0001-pull-based-indexing-over-push-based-capture|The later pivot to pull-based indexing]] removed the questions themselves, not just the answers: without a shared store x-memory writes to, there's no append-log to version or prune in the first place. Recorded here so a future reader finds out these were investigated and superseded, not simply forgotten.

## opencode's storage format changed mid-investigation

Worth remembering as a concrete instance of exactly the risk [[implementation-decisions#reading-through-stable-interfaces-hard-constraint|reading through stable interfaces]] guards against: while investigating this design, opencode's actual session storage turned out to have migrated from the per-message JSON file layout referenced in earlier research (`storage/{session,message,part}/*.json`) to a genuinely event-sourced SQLite database with WAL journaling — found directly in source (`packages/opencode/src/storage/storage.ts`'s `MIGRATIONS` array), not from any changelog announcement. Anything that had been built against the old file paths would have silently broken. See the ADR for the full finding.

The `PreCompact`/compaction-timing question from earlier revisions of this spec (opencode has no pre-compaction hook, only the post-hoc `session.compacted` event) is downgraded from a data-loss risk to a snapshot-freshness nicety by the same pivot — see [[implementation-decisions#materializing-snapshots|materializing snapshots]].

## Global storage lands inside a stow-managed directory

In this specific environment, `~/.config/agents` (the chosen global storage location, per [[implementation-decisions#storage-locations|storage locations]]) is not an ordinary directory — it's a symlink managed by this dotfiles repo's `stow`-based `configure.sh`, pointing into `~/.dotfiles/agents/.config/agents/`, which is itself git-tracked. A rebuildable cache file written there without a `.gitignore` entry would get swept into version control the next time the user runs a broad `git add`. This isn't a reason to change the location — the whole point of choosing it was to align with this repo's existing convention — but the implementation needs its own `.gitignore` entry for `x-memory/index.db` under that path (the `snapshot.md` companion file, per the project tier, is the one meant to be tracked; the global tier's own cache should not be, for the same "derived and rebuildable" reasoning as the project tier's cache).

## Others have already noticed this exact gap

While confirming that opencode has no native awareness of Claude Code's memory conventions, two small third-party bridge plugins turned up that exist specifically to patch it: `kuitos/opencode-claude-memory` and `mc303/claude-mem-opencode`. Neither was investigated in depth (out of scope for this pass), but their existence is itself evidence worth recording: this isn't a hypothetical problem being solved speculatively, it's one at least two other people independently built a patch for.

## Relationship to existing memory conventions

This remains a deliberately separate system from Claude Code's own per-project session memory (`~/.config/claude/projects/<slug>/memory/`, the `MEMORY.md` index-and-pointer convention already in use in this repo) — that system is Claude-Code-only and manually curated, x-memory is automatic and cross-tool, and nothing about x-memory reads or writes those specific files. But the pivot to pull-based indexing made the two systems closer in *shape* than before: [[glossary#snapshot|snapshot]]'s "a plain Markdown file, index-and-pointer style, meant for human review" is structurally the same idea `MEMORY.md` already is, just automatically maintained instead of hand-curated and scoped across two tools instead of one. Worth revisiting in a future spec whether x-memory's snapshots and the existing `MEMORY.md` convention should actually be the same file format, even if they stay functionally separate.
