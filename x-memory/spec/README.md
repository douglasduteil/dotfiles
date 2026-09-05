# x-memory — spec

x-memory is a small local tool that lets a coding session started in Claude Code be picked up in opencode, and vice versa, without the user re-explaining what they were doing. It exists because neither tool currently bridges the other, and three existing off-the-shelf tools were evaluated and rejected for concrete, verified reasons (see [[alternatives-evaluated]]).

This folder is the spec, not the implementation. No code lives here.

## Pages

- [[docs/adr/0001-pull-based-indexing-over-push-based-capture]] — **read this first if you're picking up the spec cold.** The architecture pivoted mid-design, from x-memory capturing writes during a session to x-memory indexing what each tool already durably stores. Several pages below record both the original reasoning and why it was superseded — that history is kept deliberately, not cleaned up, so don't be surprised to see decisions marked "superseded" rather than silently absent.
- [[problem-and-solution]] — why this exists, what it does, from the user's perspective
- [[user-stories]] — the full list of user-facing scenarios this must handle
- [[retrieval-use-cases]] — the retrieval side specifically: the startup breadcrumb vs. agent-invoked deep recall, and why they're two separate moments
- [[glossary]] — canonical terms (recap, handoff, observation, project, staleness) so later discussion doesn't drift
- [[implementation-decisions]] — the shape of the thing: storage, hooks, the reducer, the two defects found and their fixes
- [[testing-decisions]] — what "correct" means and how it's checked
- [[out-of-scope]] — what this deliberately does not do
- [[further-notes]] — environment context and open threads
- [[alternatives-evaluated]] — the primary-source record of why agentmemory, supermemory, and hippo-memory were each rejected
- [[lessons-from-alternatives]] — feature-by-feature, fact-checked verdicts on what those three tools got right or wrong, and what x-memory adopts, adapts, or explicitly rejects because of it

## How this was derived

This spec was synthesized from a long design conversation, not a fresh interview. Three things grounded it in evidence rather than assumption:

1. A logic prototype (throwaway HTML + a Bun CLI twin) that pushed a reducer-based state model through six hard cases — crash mid-session, wrong-project leakage, stale recap, concurrent sessions — and found two real defects.
2. A live trial of `agentmemory`, `supermemory`, and `hippo-memory`, each installed and exercised for real (not just read about), each rejected for a specific, verified reason rather than a vibe.
3. Direct source/doc verification of both tools' actual session/hook primitives (Claude Code's `SessionStart`/`SessionEnd` hooks and Agent SDK session methods; opencode's `session.*` plugin events and `chat.system.transform` injection point), so the implementation decisions below aren't guesses about what's available.
