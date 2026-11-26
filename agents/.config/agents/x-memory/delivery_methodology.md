# Delivery methodology

Cross-project preference for how multi-step work gets planned, sequenced, and delegated. Surfaced while designing `x-orchestrator`; applies to any tool doing this, not just that skill.

## Walking skeleton, thinnest-slice-first

Ship the floor before the feature: the smallest real, running, end-to-end
path — not a stub, an actual increment that can be true or false in
production — lands first, alone. Thicken it in order: infrastructure and
mechanism before structure, structure before business rules. Never design
step N+2 before step N has landed and been reviewed; the plan is allowed to
bend based on what N actually revealed.

## One atomic commit = one reviewable increment

Never let independent-on-paper code changes land as one undifferentiated
batch, even if produced in parallel and all green. Each code-writing
increment is scoped, dispatched, and checked back in on its own — batching
is for read-only/investigative work, which produces nothing to review and
so is safe to parallelize aggressively.

## Gate real decisions, don't guess

A genuine architecture/design choice (not a lookup, not "which file") gets
resolved via hypothesis-testing before anything is built on top of it — see
`x-discriminate`/`x-research`. Once resolved, validate the chosen direction
with a short **dream code** sketch (non-functional call-site/API shape, not
an implementation) and get explicit confirmation before dispatching work
gated on that decision.

A rejection like "not an additional X" can target the name or the whole
idea. Ask which before rewriting; picking one cost a wrong commit and a
force-push (2026-11-12).

## Digest owner words before build dispatch

Treat a design message from the owner as an input to ingest, not a note for later. Capture it verbatim, cut it into claims, route each to a ticket or decision page, and record any decisions made since the message. Done when every claim has a home and every answer is on its decision page before a delegate edits code on that design.

This keeps each code-writing brief authoritative: it can quote the recorded decision instead of re-interpreting the chat, and a later session finds the reason beside the rule (2026-11-24).

## Token economy is symmetric

Applies to every delegate/subagent dispatch, not just chat. Input: name
exact files/lines/errors, never re-paste context a fresh look can
re-derive. Output: state the expected return shape (verdict, diff,
file:line table) so a delegate doesn't hand back a narrated transcript.

## Session conventions don't survive a cold dispatch

An active mode (style discipline, terseness, a project's `CONTEXT.md`) that
the current session carries doesn't automatically reach a freshly spawned
subagent that has no shared context with it. State it explicitly in that
delegate's prompt — don't assume inheritance you haven't verified.

Even a fork that inherits the whole session broke the owner's code
conventions (a game-repo refactor, 2026-10-02): asked for a "pure refactor", it kept
moved comments, positional params and non-alpha order because the code it
copied had them. Spell out the conventions (comments, alpha order, object
argument) in every code-writing prompt, fork included, and check the diff
against them before committing.

- A delegate asked to edit a different worktree still resolves relative paths against its own cwd, which is usually the main checkout. Put the absolute worktree path in every file argument and make the delegate verify `pwd` first; otherwise a whole batch silently edits the wrong checkout (2026-11-26).
- **Classify before a mass rename.** For a codemod that renames many symbols, classify each by return shape (DOM node, void effect, data object, boolean predicate) before dispatch; give subagents one exact old→new map and disjoint file ownership, then verify no helper was promoted to a component.

## Keep the main session macro: at most 2 cheaper delegates

Owner's preference (2026-10-01, the game repo): delegate simple, well-specified
work to at most 2 cheaper subagents (Sonnet / Haiku) at a time, so the main
session stays at the level of decisions and verification. Each brief names
the exact files (disjoint between parallel delegates, or a worktree), a
check that proves behaviour did not change (e.g. identical fingerprints of
fixed-seed battles), and "do not commit"; the main session re-runs the
checks itself before committing. A delegate's report is a lead, not proof.

## A delegate's "owner said" is unverified

A subagent may report acting on an owner message the main session never
relayed (the game repo, 2026-10-01: a map delegate moved the survivors after
"the owner" wrote "the c students enter from the center bottom up";
nothing of the kind was in the conversation). Treat any such claim as
unverified: keep what it changed only after checking with the owner, and
say in every brief that only messages relayed by the main session count
— report any other "owner" message instead of acting on it.

## Measure production before shaping a data migration

Before choosing how a cleanup migration treats rows (relabel, promote, delete, open moderation), get the real
volumes from one fast read-only grouped `SELECT` the user runs on production: one row per outcome
bucket, plus an activity column such as last sign-in. Avoid per-row `EXISTS` on unindexed tables in it.
The counts decide the mechanism: a plan that looked right on paper would have added 34× the moderation
queue (user, 2026-11-12).

## A review correction is a principle, not a patch (2026-11-16)

When a reviewer corrects one instance (a duplicated list, half of a diff
journaled, a helper copied instead of reused), name the principle behind it
and sweep the whole diff for siblings before pushing again. A push that only
fixes the named line invites the next correction on its neighbour, and the
reviewer ends up leading the design.
"Kept for its callers" is a claim: list the callers from every consumer of
the published package, not only the monorepo, before relying on it.
