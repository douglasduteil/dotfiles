---
name: x-proposal
description: Create or continue a durable change-proposal folder under `.agents/x-proposal/<slug>/` — an OpenSpec-style, cross-tool stand-in for "plan mode": the planning mechanism itself in opencode (no native plan mode), and where Claude Code's plan mode can persist a proposal past its ephemeral plan file. Merges `grilling`'s interview loop with `to-spec`'s synthesis template, and always produces an OpenSpec-rigor `tasks.md`. Use for "let's plan X", "write a proposal for X", "/x-proposal", or any plan-mode-shaped request in a tool without plan mode.
user-invocable: true
argument-hint: <topic or slug>
---

# x-proposal

Folder-per-change proposal, not a chat scratchpad. One proposal survives one decision; this skill's job is to make it survive the session too.

1. Resolve a slug (kebab-case from the argument, or ask). Read `.agents/CONTEXT.md`'s `## Language` section and `.agents/x-memory/index.md` if they exist — skip silently if not, don't require them.
2. Check `.agents/x-proposal/<slug>/`. If a `proposal.md` already lives there and this change supersedes it (different problem, or a decision that reverses it) rather than continuing it, archive it first (step 7) before writing the new one. Continuing the same open decision is not superseding — keep working the same folder.
3. Load `mattpocock-skills:writing-for-agents` before drafting `proposal.md` or `tasks.md` — both are documents another agent (or a future session) consumes cold; write them to that bar, not as chat output.
4. Interview: run `grilling`'s frontier/round loop directly — every open question whose prerequisites are settled, `❓`/`➡️` format, until the frontier is empty. Look things up yourself; only actual decisions go to the user. Keep the interview's own chat turns to `ponytail:ponytail`'s ladder (don't scope in speculative work) and `caveman:caveman`'s terseness (questions and status updates, not the documents themselves — `proposal.md`/`tasks.md` stay normal prose, matching how `caveman` already exempts persisted docs).
5. Write the final `proposal.md` in `to-spec`'s shape: Problem Statement / Proposed Change / Alternatives Considered / Decisions (the resolved Q&A log) / Verification / Open Questions (deferred) / Out of Scope / Suggested Next Skills.
   - **Proposed Change** lists every file that changes, generated ones included — a dependency add means the lockfile changes too, state it, don't let "no other file changes" go unqualified. Apply `ponytail:ponytail`'s ladder here: cut anything speculative before it lands in scope.
   - **Verification** gives concrete pass/fail checks, not "confirm nothing broke" — e.g. which existing test failures are pre-existing baseline vs regression, what a byte-identical build diff would prove. Whoever implements from `proposal.md` alone (`implement-spec` or otherwise) checks against this, not ad-hoc checks it invents mid-implementation.
6. Always write a sibling `tasks.md`, OpenSpec-rigor: a hierarchical numbered checklist, tasks grouped under thematic `## N. <Theme>` headings and numbered `- [ ] N.M <task>` within each, every task completable in one session and traceable to a line in `proposal.md`'s Proposed Change or Verification. No open-ended items ("polish", "cleanup") — each box is a checkable unit of done.
7. **Archive on supersede or completion.** When a proposal is superseded (step 2) or its decision has fully landed (every `tasks.md` box checked, or the user confirms it's abandoned), move the whole folder to `.agents/x-proposal/archive/<YYYY-MM-DD>-<slug>/` — full contents preserved, nothing summarized away. Update the `.agents/x-memory/index.md` link (step 9) to point at the archived path, or drop it if nothing else references the decision.
8. "Suggested Next Skills" names whichever of `to-tickets`, `implement-spec`, `x-research` fits — `to-tickets` when `tasks.md`'s items need publishing to a real tracker, not as a replacement for `tasks.md` itself. Redact secrets/PII, same rule as `handoff`.
9. Link `.agents/x-proposal/<slug>/proposal.md` from `.agents/x-memory/index.md` (add a page entry, or update the existing one on a repeat visit).

Completion: frontier empty, `proposal.md` written with its Verification section, and `tasks.md` written — not "enough context gathered." If implementation surfaces something the proposal's Open Questions missed, that's new evidence for the relevant `x-research` branch's `index.md`, not a fact to just note in passing.

Reuse `grilling`, `to-spec`, `to-tickets`, `handoff` by invoking/referencing them; don't reimplement their mechanics here.
