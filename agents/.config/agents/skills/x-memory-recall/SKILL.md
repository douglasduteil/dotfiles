---
name: x-memory-recall
description: Recall prior work on this project from the *other* coding tool (Claude Code <-> opencode session history). Use when the user references something from a previous session you don't have context for — "what did we decide about X", "finish what we started", "what was that bug we found" — especially if they mention working in the other tool, or their message implies continuity you can't see in this session's own history.
user-invocable: true
allowed-tools:
  - Bash(x-memory query:*)
---

# x-memory recall

This is the on-demand retrieval moment, distinct from the passive
one-line startup breadcrumb (session count + recency) already injected
automatically at session start. Call this only when the user's message
suggests you need real content from prior work — not on every message.

## Usage

```
x-memory query --project <this project's git root> [--search "<topic>"] [--scope project|global]
```

- Omit `--search` to get the single most recent non-rejected session's
  recap, flagged `[stale]` if older than 7 days.
- Pass `--search "<term>"` for a ranked, extractive search over all
  indexed sessions (FTS5 + recency — no LLM synthesis, no network call).
- Omit `--scope` to get this project's own history plus any applicable
  global (cross-project) conventions; pass `--scope global` to see only
  those.

Each result line starts with an entry id (`<source-tool>:<session-id>`,
e.g. `opencode:ses_abc123`). If the recap turns out to be wrong or
irrelevant, tell the user they can correct it:

```
x-memory reject <entry-id> [--scope project|global]
x-memory pin <entry-id> [--scope project|global]
```

## Reading the result

Output is extractive — real snippets from the other tool's session
text, not a synthesized summary. Treat it as a lead to verify, not a
settled fact: a `[stale]` tag means the underlying session is more than
7 days old; still worth reading, just confirm it's still accurate
before acting on it, per this repo's own "don't take a recalled fact as
settled truth" convention.

If the command reports "No recap found," there's simply no indexed
history yet for this project (or this search term) — say so plainly,
don't guess.
