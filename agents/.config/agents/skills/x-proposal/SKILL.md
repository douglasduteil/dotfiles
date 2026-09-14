---
name: x-proposal
description: Create or continue a durable change-proposal folder under `.agents/x-proposal/<slug>/` — an OpenSpec-style, cross-tool stand-in for "plan mode": the planning mechanism itself in opencode (no native plan mode), and where Claude Code's plan mode can persist a proposal past its ephemeral plan file. Merges `grilling`'s interview loop with `to-spec`'s synthesis template. Use for "let's plan X", "write a proposal for X", "/x-proposal", or any plan-mode-shaped request in a tool without plan mode.
user-invocable: true
argument-hint: <topic or slug>
---

# x-proposal

Folder-per-change proposal, not a chat scratchpad. One proposal survives one decision; this skill's job is to make it survive the session too.

1. Resolve a slug (kebab-case from the argument, or ask). Read `.agents/CONTEXT.md`'s `## Language` section and `.agents/memory/index.md` if they exist — skip silently if not, don't require them.
2. Create `.agents/x-proposal/<slug>/proposal.md`.
3. Interview: run `grilling`'s frontier/round loop directly — every open question whose prerequisites are settled, `❓`/`➡️` format, until the frontier is empty. Look things up yourself; only actual decisions go to the user.
4. Write the final `proposal.md` in `to-spec`'s shape: Problem Statement / Proposed Change / Alternatives Considered / Decisions (the resolved Q&A log) / Verification / Open Questions (deferred) / Out of Scope / Suggested Next Skills.
   - **Proposed Change** lists every file that changes, generated ones included — a dependency add means the lockfile changes too, state it, don't let "no other file changes" go unqualified.
   - **Verification** gives concrete pass/fail checks, not "confirm nothing broke" — e.g. which existing test failures are pre-existing baseline vs regression, what a byte-identical build diff would prove. Whoever implements from `proposal.md` alone (`implement-spec` or otherwise) checks against this, not ad-hoc checks it invents mid-implementation.
5. Only add a sibling `tasks.md` (`to-tickets`'s tracer-bullet + blocking-edge frontier) if the proposal is big enough to need ticket breakdown — don't create it by default.
6. "Suggested Next Skills" names whichever of `to-tickets`, `implement-spec`, `x-research` fits. Redact secrets/PII, same rule as `handoff`.
7. Link `.agents/x-proposal/<slug>/proposal.md` from `.agents/memory/index.md` (add a page entry, or update the existing one on a repeat visit).

Completion: frontier empty and `proposal.md` written, Verification section included — not "enough context gathered." If implementation surfaces something the proposal's Open Questions missed, that's new evidence for the relevant `x-research` branch's `index.md`, not a fact to just note in passing.

Reuse `grilling`, `to-spec`, `to-tickets`, `handoff` by invoking/referencing them; don't reimplement their mechanics here.
