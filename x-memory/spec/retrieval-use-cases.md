# Session Knowledge Retrieval — Use Cases

This page narrows [[user-stories]] down to the retrieval side specifically, with concrete scenarios, following the settled shape: x-memory is a dumb, reliable [[glossary#index|index]] (see [[user-stories#5|Q5]] confirmed) — it never decides what's relevant. Judgment stays with the agent.

## The two retrieval moments

**1. Startup breadcrumb (automatic, minimal).** When a new session starts in either tool, x-memory's read-side hook (`SessionStart` / `chat.system.transform`) injects one line, not a recap: *"x-memory: 4 prior sessions on this project, most recent 2 hours ago in opencode — ask if you want the recap."* This is the "bare minimum" the user asked for — enough to know history exists and roughly how fresh it is, cheap enough to never feel like a tax, without pre-empting whether the agent or user actually needs it this session.

**2. Deep recall (agent-invoked, on demand).** A tool call the agent makes when it judges the user's message references prior work — not a keyword trigger x-memory runs unprompted. Concretely:

- User: *"where did we land on the concurrent-write thing?"* → agent recognizes this as a backward reference, calls `query` for this project with "concurrent-write" as the search term, gets back FTS5-ranked snippets from the index, and answers from them — quoting or paraphrasing, and treating the result as a lead to verify, not ground truth (see [[user-stories#retrieve-without-blind-trust|below]]).
- User: *"continue the x-memory work"* with no specifics → agent calls `query` for this project with no search term, gets the single most-recent-session recap, and picks up from there.
- User asks something with no apparent connection to prior sessions → agent doesn't call `query` at all. Silence is the correct behavior most of the time; the breadcrumb already told the agent history exists, so choosing not to pull it is a normal outcome, not a missed feature.

## Retrieve without blind trust

The user was explicit: *"retrieve the latest valid memory without taking it as blind truth."* This is a behavioral constraint on the agent consuming `query`'s output, not something x-memory itself can enforce mechanically — but the design supports it: `query` always returns provenance (`source_tool`, `session_modified_at`, staleness flag) alongside the content, specifically so the agent has what it needs to say "according to a session from 3 weeks ago in Claude Code, X — worth confirming that's still true" instead of asserting X outright. This mirrors the exact instruction already governing this Claude instance's own auto-memory system ("verify that the memory is still correct... before building assumptions") — the same discipline, now extended to recalling the *other* tool's work, not just this tool's own past sessions.

## Concrete scenarios

1. **Cold open, no history.** Brand-new project, first session ever in either tool. No breadcrumb (nothing to point at) — see [[user-stories#8|story 8]], unchanged by this page.
2. **Same-tool continuation.** User reopens Claude Code on a project they were just in yesterday, in Claude Code. The breadcrumb still fires (it's tool-agnostic — it reports on the *project's* history, not specifically the other tool's), but a same-tool `--continue`/`--resume` likely already gives the agent this context natively; x-memory's value here is lower than the cross-tool case, but the mechanism doesn't need to special-case it away.
3. **Cross-tool pickup, specific question.** User was debugging a race condition in Claude Code, closes it, opens opencode, and asks "did we figure out why the race condition happened?" — agent calls `query` for this project with "race condition" as the search term, not a generic full-recap pull, because the question itself supplies the term. Narrower queries should return narrower, more useful snippets than a full-session dump.
4. **Vague continuation.** "What was I doing?" with zero specifics — the cold-recall case from [[user-stories#5|story 5]], answered by `query` for this project with no search term, returning the newest session's recap.
5. **Wrong recall, corrected.** The agent surfaces something from a recalled session that's actually stale or was already superseded by later work the index hasn't caught up on yet. The user says "no, that's not right anymore" — this is exactly the [[implementation-decisions#correcting-a-wrong-recap|reject mechanism]]'s trigger condition, invoked by the agent on the user's correction, not something the user has to operate a CLI for themselves.

## Where this leaves the startup-injection decision

An earlier revision of [[implementation-decisions#hook-wiring|hook wiring]] described `SessionStart` injecting a full compressed recap automatically. This page revises that: `SessionStart` injects only the breadcrumb described above; the compressed recap itself is returned by an explicit `query` tool call the agent makes, not pushed automatically every time a session starts. See [[implementation-decisions]] for the corresponding update.
