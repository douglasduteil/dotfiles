# Archived threads

This file holds spec paragraphs that have been **superseded by a later decision** and kept verbatim so the trail of why each old answer was wrong (or just no longer needed) is recoverable. New readers should treat this as a record of decisions already considered, not live spec.

Each entry below preserves the original wording and notes what superseded it.

---

## Materializing snapshots (superseded)

**Superseded by:** the curated `.agents/memory/` wiki convention in the shared user-level `AGENTS.md` (see "Curated memory" section).

**Original location:** `implementation-decisions.md` § Materializing snapshots (was lines 117–123).

**Supersession reason:** The auto-regenerated `snapshot.md` file is replaced by a curated, human-gated wiki at `<project>/.agents/memory/` and `~/.cache/agents/memory/`. The wiki is the durable knowledge surface; x-memory's index remains the session-history search surface. The two together cover what the snapshot tried to do (and more, with explicit "remember this" prompts and stacked-feedback triage) without x-memory ever overwriting curated content.

### Original prose (preserved)

> Separately from `index` (which runs automatically) and `query` (which the agent calls on demand — see [[retrieval-use-cases]]), x-memory periodically or on request writes a [[glossary#snapshot|snapshot]] — a plain Markdown file per project, derived from the index — so the user can review their own history by opening a file.
>
> This is deliberately **not** written into Claude Code's own `~/.claude/projects/<slug>/memory/` directory. That directory and its `MEMORY.md`-index-plus-typed-files convention were confirmed (via Claude Code's own official docs) to be a real, on-by-default, Claude-Code-only feature — opencode has no awareness of it at all, confirmed by opencode's own docs never mentioning it and an open opencode feature request (`#9211`) asking for a memory system, which wouldn't exist if one were already there. Writing into that directory would produce a file only one of the two tools this project targets could ever read. The shape of that convention — one index file, per-topic files with typed YAML frontmatter, git-native — is worth keeping (an independent spec, [okf.md](https://okf.md), converged on almost the identical shape for the same reason, though it's young, single-maintainer, and adopted by no major platform, so it's the *pattern* worth following, not that specific named spec). x-memory's snapshot lives in its own location, readable by both tools' file-reading conventions, not inside either tool's private state.
>
> Trigger candidates for writing a snapshot: an explicit command, a simple elapsed-time-or-message-count heuristic during a long session, or Claude Code's real `PreCompact` hook as a convenient natural checkpoint. None of these are correctness-critical the way they would have been under the pre-ADR design — a missed or stale snapshot is a staleness problem for the human reader, not data loss, since it's always regenerable from the index.

### Related open thread (also superseded)

**Original location:** `further-notes.md` § Relationship to existing memory conventions (was lines 27–29).

> This remains a deliberately separate system from Claude Code's own per-project session memory (`~/.config/claude/projects/<slug>/memory/`, the `MEMORY.md` index-and-pointer convention already in use in this repo) — that system is Claude-Code-only and manually curated, x-memory is automatic and cross-tool, and nothing about x-memory reads or writes those specific files. But the pivot to pull-based indexing made the two systems closer in *shape* than before: [[glossary#snapshot|snapshot]]'s "a plain Markdown file, index-and-pointer style, meant for human review" is structurally the same idea `MEMORY.md` already is, just automatically maintained instead of hand-curated and scoped across two tools instead of one. Worth revisiting in a future spec whether x-memory's snapshots and the existing `MEMORY.md` convention should actually be the same file format, even if they stay functionally separate.

The "revisit in a future spec" question is now answered: yes, but the format lives in `.agents/memory/` (shared user-level convention), not inside Claude Code's private `~/.claude/projects/<slug>/memory/`. The reasoning against writing into that private directory still stands and is preserved above.

---

## Snapshot glossary entry (superseded)

**Superseded by:** the curated `.agents/memory/` wiki convention in the shared user-level `AGENTS.md`.

**Original location:** `glossary.md` § Snapshot (was lines 29–31).

> A periodically or on-demand materialized Markdown file per project, derived from the index, meant for a human to read directly (open the file, review the prose) rather than query through a tool. Not the source of truth — regenerable from the index at any time — but the answer to [[user-stories#27|the "facilitate future human review" story]].

The "facilitate future human review" need is now served by `.agents/memory/`, which the agent curates with human confirmation. The `x-memory` `snapshot` subcommand and the `snapshot.ts` / `snapshot.test.ts` source files were deleted at the same time as this archival.
