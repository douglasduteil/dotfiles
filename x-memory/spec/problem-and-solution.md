# Problem Statement

The user works on the same project across two different coding-agent CLIs: Claude Code and opencode. Each tool keeps its own session history in its own format, in its own location, and neither reads the other's. When the user switches — deliberately, or because one tool crashed, or just because a new terminal happened to open the other one — the new session starts cold. The user has to re-explain what they were doing, what was decided, and what's left to do.

Claude Code already has a memory convention for this (`CLAUDE.md`, per-project session memory under `~/.claude/projects/<slug>/memory/`), but it's Claude-Code-only. opencode has no equivalent, and nothing bridges the two.

Three off-the-shelf tools were evaluated as a shortcut past building this. All three were rejected for concrete reasons — see [[alternatives-evaluated]] — so the problem remains open.

# Solution

Both Claude Code and opencode already write their own session history durably and incrementally as a session happens — confirmed directly, not assumed (see [[docs/adr/0001-pull-based-indexing-over-push-based-capture]]). x-memory doesn't need to intercept and capture that data as it's produced; it needs to read it, on demand, through each tool's own stable interfaces. Concretely, x-memory:

1. Watches for a session **starting** in either tool (Claude Code's `SessionStart` hook, opencode's `chat.system.transform` injection point) and, at that moment, indexes-if-stale the other tool's most recent session for the current [[glossary#project|project]] and injects a compressed **recap** as context.
2. Maintains its own small, local, full-text **index** (see [[glossary#index|index]]) — pointers into each tool's session storage plus extracted searchable text, not a copy of the content, and fully rebuildable from source at any time.
3. Flags an injected recap as **stale** past an age threshold on the underlying session, rather than presenting a six-month-old fact with the same confidence as one from five minutes ago (the failure mode this spec is explicitly designed against — see [[glossary#staleness|staleness]]).
4. Never leaks a recap across projects (see [[implementation-decisions#scope-constraint-hard-constraint-not-a-preference|scope constraint]]). A crash mid-session, or two tools running concurrently on the same project, are no longer defects to fix — both were artifacts of an earlier design where x-memory itself owned the write path; reading from each tool's own already-durable storage sidesteps both by construction (see the ADR for why).
5. Periodically or on request, materializes a human-readable **snapshot** — a Markdown file per project — so the user can review their own history by opening a file, not just by querying a tool (see [[user-stories#27|story 27]]).

The user should be able to end a session in one tool — however it actually ends, cleanly or not — open the other, and have it already know the summary and the next step, without running any command by hand.
