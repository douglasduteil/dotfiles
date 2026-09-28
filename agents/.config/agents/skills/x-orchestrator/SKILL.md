---
name: x-orchestrator
description: Break a complex multi-step task into a tracked checklist and drive it to done by delegating each item to the right existing skill or subagent — forking for context-dependent work, spawning fresh agents for independent work, batching independent items in parallel, and looping until the checklist is clear. Use for "orchestrate this", "delegate this to subagents", "run these in parallel", "todo-driven" work, or any task with enough independent parts that single-threaded sequential execution would waste turns. Not for a task with one obvious next step, or one that only needs a single fork's private reasoning — dispatch that directly instead.
user-invocable: true
argument-hint: <task or proposal slug>
---

# x-orchestrator

Claude Code's answer to opencode's Sisyphus: the same todo-driven, parallel-delegation model, built entirely from skills and agents already in this toolbox — no new agent zoo, no new hook, no new todo tool. Dual-runtime by design, same as `x-proposal`: this skill folder is on both tools' skill path (`opencode.jsonc`'s `skills.paths` includes `~/.config/agents/skills`). Where a step names a Claude Code-specific mechanism, the parenthetical gives the opencode equivalent — verified from `opencode.jsonc`/`opencode agent list` in this setup, not assumed:

| Concept | Claude Code | opencode |
|---|---|---|
| Cold, independent subagent | `Agent` tool, `subagent_type: "general-purpose"` | its own agent-dispatch tool, targeting the `general` agent |
| Read-only locator | `Explore` agent type | `explore` agent |
| Read-only architecture/design | `Plan` agent type | `plan` agent |
| Context-sharing, cache-cheap dispatch | `Agent` tool, `subagent_type: "fork"` | **no verified equivalent** in this config — every opencode dispatch is cold, treat it like a fresh `general-purpose` delegate throughout this skill |
| `caveman:cavecrew-*` crew agents | available (plugin agents) | **not registered** here — fall back to `general`/`explore` and state caveman formatting explicitly (step 4's caveman bullet already covers this) |

1. **Get or make the checklist.** A todo-driven orchestrator needs a checklist durable across dispatches — reuse `x-proposal`'s `tasks.md` instead of inventing a second tracker. If `.agents/x-proposal/<slug>/tasks.md` already covers this task, use it. Otherwise run `x-proposal` first; for a checklist too small to justify a proposal folder, write one `## Tasks` block of `- [ ] N task` lines directly in the message instead and treat that as the checklist for this dispatch only — skip the folder.
   - **Sequencing is `x-proposal`'s job, not this skill's** — don't reorder its `tasks.md`. But do a cheap skim before the first dispatch: if a business-logic-shaped item sits before the plumbing/structural item it plausibly depends on, surface a one-line warning and dispatch in the listed order anyway unless told to reorder. Passive check, not a gate.
2. **Read `.agents/CONTEXT.md` if it exists** (domain-modeling's file — never create it here; a task that actually needs one missing routes to `mattpocock-skills:domain-modeling` as its own checklist item). A Claude Code fork inherits this session's context already; every other delegate (`general-purpose`/`Explore`/etc. in Claude Code, any dispatch in opencode per the table above) does not, and can misname a domain term or violate a decision recorded in `docs/adr/` without it — carry the relevant excerpt into that delegate's prompt.
3. **Gate any architecture decision through `x-research` before dispatching tasks that depend on it.** If the checklist includes picking between competing designs/approaches (not every checklist does — a lookup, a review, a file move has no hypothesis to test, skip this), run `x-research`'s hypothesis-tree loop on it first rather than guessing or taking the first idea. Once a branch is confirmed, write **dream code**: a short, non-functional sketch of the chosen direction's call-site/API shape — not an implementation — and get the user's explicit confirmation on it before dispatching any task gated on that decision. Tasks that don't depend on the decision aren't gated and can dispatch in parallel regardless.
4. **Classify each open task** against the delegation table below and pick a delegate. Default to the laziest dispatch that gets the task done — `ponytail:ponytail`'s ladder applies to *delegation* choices too: don't spin up a fresh agent for something answerable in one Read.
   - **No meaningless code, in our style (ponytail + `x-conventions`):** a Claude Code fork inherits both automatically if active this session — nothing to add. Every other delegate that writes or edits code (this is every code-writing delegate under opencode, per the table above) — `general-purpose`, `caveman:cavecrew-builder` included, its own description promises a caveman-formatted receipt, not YAGNI or style discipline — needs both stated explicitly in the prompt: the ladder when ponytail is active, and the applicable rule from `x-conventions`' wiki (branch/commit shape, ordering, test/runtime quirks) when the task touches a topic that wiki covers. Check the wiki yourself first, don't rely on the delegate to reach `x-conventions` on its own — a fresh agent's own skill triggering isn't guaranteed to fire the same way yours does. Read-only delegates (`Explore`, `Plan`, investigators, reviewers) don't touch code, skip both.
   - **Token economy, both directions (caveman):** on input, this is your discipline, not the delegate's — name exact files/lines/errors, don't re-paste transcript or context it can re-derive; a bloated prompt costs the same as a bloated reply. On output, tell every delegate what shape the answer should come back in (a verdict, a diff, a file:line table) so it doesn't return a narrated transcript; skip restating this only for `caveman:cavecrew-*` delegates, whose own definitions already guarantee compressed output.
5. **Batch read-only tasks; walk-skeleton the code-writing ones.** Tasks with no dependency between them and no code-writing delegate go in one response with multiple dispatch calls — this is the "aggressive parallel execution" Sisyphus is named for, and it's safe here because nothing lands unreviewed. Code-writing tasks don't batch, even when independent on paper, and even when the delegate is a fork — a diff is a diff regardless of which delegate produced it: dispatch one at a time, thinnest-slice-first — plumbing and structure before the business rule that depends on them, walking-skeleton order, never a step designed two ahead of what's currently landed. Each dispatch is scoped to one atomic, independently-committable increment; a delegate's prompt names that one increment, not the eventual full shape. This is the direct fix for three code-writing subagents landing in parallel as one undiffable blob nobody can review.
6. **Check results back into the checklist** before the next dispatch goes out. Each returning agent's report flips its `tasks.md` box to `[x]` (or updates the inline block from step 1) — the checklist, not memory, is what's actually done.
7. **Loop until the checklist is clear — but checkpoint after every code-writing dispatch, not after findings.** A read-only batch produces nothing to review yet: dispatch the next batch without waiting to be asked. A code-writing dispatch produces a diff the user hasn't seen: stop, summarize what changed (caveman-compressed, same shape rule as step 4) and get a go-ahead before the next one — one atomic commit, one checkpoint, never a pile of unreviewed changes at the end. If the whole run needs to survive past this turn (long-running, or the user isn't watching), hand continuation to the `loop` skill instead of polling manually — that's Sisyphus's `ralph-loop` hook, already built here. `loop` is a Claude Code-native feature, not on the shared skill path — opencode has no confirmed equivalent here; fall back to re-running the dispatch loop by hand each turn there until that's verified.
8. **Close out.** Checklist clear → summarize what shipped, and run `x-memory-curate` if anything from the run is worth keeping past this session (a dead end, a reason behind a choice) — never write to the wiki silently.

## Delegation table

Names below are Claude Code's; run the runtime table at the top through them for opencode.

| Task shape | Delegate | Why |
|---|---|---|
| Needs this session's already-loaded context, but its output would just clutter this transcript | `Agent` (`subagent_type: "fork"`) | Shares prompt cache + context, keeps noise out |
| Independent, bounded, no shared context needed | `Agent` (`general-purpose`, or a more specific type below) | Cold start is fine, it doesn't need history |
| "Where is X" / "what calls Y" / map a directory | `Explore`, or `caveman:cavecrew-investigator` if caveman mode is active | Read-only locator, purpose-built |
| 1-2 file surgical edit, scope obvious | `caveman:cavecrew-builder` if caveman mode is active, else `Agent general-purpose` | Bounded edit, refuses scope creep |
| Diff/branch/PR review | `code-review` skill (Claude Code-native, not on opencode's skill path — use `caveman:caveman-review` there instead), or `caveman:cavecrew-reviewer` | Existing review machinery |
| Architecture/design plan | `Plan` agent type | Built-in planner, read-only |
| Ambiguous root cause, hypothesis unclear | `x-research` | Already owns the hypothesis-tree + fork-per-hypothesis model |
| Documentation/API fact lookup | `mattpocock-skills:research` | Already does source-grounded lookup + writeup |
| Merge conflict resolution | `mattpocock-skills:resolving-merge-conflicts` | Existing skill |
| Long-running / needs to survive past this turn | `loop` skill | Existing self-pacing continuation |

Never reimplement what a row's delegate already does — this skill only adds the checklist and the batching discipline on top of them.

Completion: `tasks.md` (or the inline block) fully checked — not "most of it delegated."
