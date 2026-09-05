# Lessons from Alternatives

[[alternatives-evaluated]] records why `agentmemory`, `supermemory`, and `hippo-memory` were each rejected wholesale. This page goes one level deeper: each rejected tool still shipped individual mechanisms aimed at problems x-memory also has. Every claim below was checked against actual source (not README prose) and, where feasible, run live in an isolated scratch environment. Each item ends with a verdict: **adopt**, **adapt**, or **reject**, and — where adopted — a pointer to the spec page it now changes.

## Adopted

### Reject/veto a wrong fact (from hippo-memory)

Source: `src/reject-flow.ts`, `src/rejection.ts`. Live-confirmed: `reject <id> --reason` deletes the row (or archives it, if raw), hashes the normalized content into a tombstone table, and a write-path guard throws on any future write that would reintroduce the same normalized content — confirmed by attempting to re-`remember` the identical text and having it refused until `unreject`.

x-memory currently has no way for the user to correct an injected recap that turns out to be wrong (a real gap — nothing in [[user-stories]] covered it before this pass). A content-hash tombstone plus a write-time guard is a handful of lines and closes it outright.

**Verdict: adopt.** See the new decision in [[implementation-decisions#correcting-a-wrong-recap|correcting a wrong recap]] and new story in [[user-stories#24|story 24]].

### Pin a fact against staleness (from hippo-memory)

Source: `src/memory.ts:316`, `src/memory-value.ts:233` — a boolean checked before any decay/staleness scoring runs, set only by explicit user action, never automatically.

A recap sometimes contains something the user wants trusted indefinitely ("this repo uses pnpm, not npm") that would otherwise eventually get the staleness caveat. A single boolean flag, checked before the age comparison, solves it.

**Verdict: adopt.** See [[implementation-decisions#pinning-a-fact|pinning a fact]] and [[user-stories#25|story 25]].

### Decay-to-floor, hard-delete only behind an explicit, narrow gate (from agentmemory)

Source: `src/functions/lessons.ts:293-378` (confidence decays linearly to a floor of 0.05, only soft-deletes — hidden from default queries, row kept — when confidence is at floor **and** the item was never reinforced) and `src/functions/auto-forget.ts` (hard-delete only behind an explicit `forgetAfter` TTL, or an age-plus-low-importance floor, both conservative and opt-in-shaped).

This settles an open question from the first draft of this spec: whether an append-log of recap entries needs active pruning to stay bounded, and if so, by what rule. The agentmemory pattern — flag stale at read time (already decided), fade further with age, but never hard-delete except behind an explicit, narrow, user-visible condition — matches [[user-stories#12|story 12]]'s spirit (never silently withhold, never silently destroy) better than either "keep everything forever" or "prune aggressively by default."

**Verdict: adopt the shape, not the machinery.** No weekly-decay-rate config, no confidence scoring system — just: old + never-referenced-again entries drop out of the default view, nothing is ever deleted without an explicit command. See [[implementation-decisions#pruning-policy|pruning policy]].

### Supersession via status + pointer, not a raw log (from hippo-memory)

Source: `src/skills.ts`, `src/policies.ts` — an old row is marked `status='superseded'` with a `superseded_by` pointer to the new row; nothing is deleted; a plain query for "the current one" is a single `status='active'` filter instead of "guess from the log."

This directly replaces the open, deliberately-unsettled derivation rule in the first draft of [[implementation-decisions]] ("most recent entry, or concatenate — an open detail"). It was left open because a raw append-log has no clean answer to "what's current." A status column plus a supersedes-pointer does, while still preserving every entry the append-log was chosen for in the first place (see [[implementation-decisions#concurrent-write-resolution|concurrent-write resolution]] — the no-data-loss goal is unchanged, only how "current" is read from the history changes).

**Verdict: adopt**, replacing the prior open item outright. See the revised [[implementation-decisions#concurrent-write-resolution|concurrent-write resolution]].

### Two read-shapes: forward-looking resume vs. backward-looking rollup (from agentmemory)

Source: `plugin/skills/handoff/SKILL.md` vs `plugin/skills/recap/SKILL.md` — one skill returns the single most recent session for the project, leads with any open question, ends with one concrete next step; the other returns the last N sessions or a time window, grouped by date, ending in an aggregate count, with no next-step pointer.

x-memory's automatic injection (see [[problem-and-solution]]) is inherently the first shape — one project, one current answer, forward-looking. But [[user-stories#5|story 5]] ("what was I doing?") and a plausible future "what have I actually been doing on this project this week?" question are the second shape, and conflating them under one term risks the exact kind of fuzzy-language problem a glossary exists to prevent.

**Verdict: adopt the distinction, not the naming** (agentmemory's own two terms collide confusingly with x-memory's existing ones — see the terminology note below). A new **rollup** term is added to [[glossary#rollup|the glossary]] for the second shape; the first shape remains exactly what [[glossary#recap|recap]] already meant. See [[user-stories#26|story 26]].

### Scope constraint must cover reads, not just writes (from hippo-memory, a second incident)

While fact-checking the mechanisms above, a second real cross-boundary incident turned up independent of the earlier settings.json one: `hippo init --scan`, run in a fully isolated scratch directory with `HIPPO_HOME` overridden, still auto-imported content from this machine's real `~/.config/claude/.../memory/MEMORY.md` files into its (scratch) store — an unrequested read across a boundary the override was supposed to establish, not just an unrequested write.

**Verdict: adopt as a hardening of an existing decision, not a new one.** [[implementation-decisions#config-write-scope-hard-constraint-not-a-preference|the existing write-scope constraint]] is renamed and broadened to cover reads: x-memory must never read from, import from, or scan any path the user didn't explicitly pass it, by default.

## Adapted (the idea, deliberately not the implementation)

### Capture before compaction, not after (from supermemory)

Source: `opencode-supermemory/src/services/compaction.ts` — a real, source-confirmed `DEFAULT_THRESHOLD = 0.80` token-usage check (not marketing language), triggered by self-polling `message.updated`/`session.idle` events and summing token usage against the model's context limit, which then **pre-emptively calls** opencode's own summarize API before opencode's native compaction would otherwise run and lossily truncate history.

The lesson: capturing at a host-fired *post-compaction* event (opencode's `session.compacted`, Claude Code's real but currently-unused-here `PreCompact`) risks capturing only what already survived a lossy summarization, not the richer pre-compaction detail. Racing ahead of compaction, the way supermemory's opencode plugin does, is a genuinely better pattern for "don't lose detail to truncation" than reacting after the fact.

**Verdict: adapt, don't fully adopt.** For Claude Code, the real `PreCompact` hook already fires *before* compaction — no self-polling needed there, just prefer it over relying on `SessionEnd` alone. For opencode, no pre-compaction hook exists yet (same gap noted in the first draft of this spec); self-polling token usage the way supermemory does is the honest alternative, but it adds real complexity (needs live per-message token/cache figures, which not every host reliably exposes) for a benefit that's marginal at x-memory's scale (a short recap, not a rich detailed transcript). Recorded as a deliberate v1 gap in [[further-notes#opencode-compaction-gap|further notes]], not solved now.

### Summarize a completed unit of work into something reusable, minus the orchestration around it (from agentmemory)

Source: `crystallize.ts` (`mem::crystallize`) — summarizes a completed action chain into a digest and feeds extracted lessons back into a persisted lessons store. The mechanism it's embedded in (a full task DAG with dependency-gated `frontier` computation and TTL `leases` for concurrent-agent lock contention — see below) is not relevant here, but "distill a finished unit into something a future session benefits from" is the same instinct behind [[glossary#recap|recap]] itself.

**Verdict: already covered by the core design, nothing new to add** — noted here only so the resemblance is on record rather than looking like an oversight.

## Rejected (checked and explicitly not worth it)

- **Working memory scratch buffer** (hippo-memory, `src/working-memory.ts`): a separate capped, LRU-evicted table with a `flush` that is, confirmed via source and a live test, a plain delete — nothing is ever promoted into the durable store. There's no auto-promotion logic to borrow, and x-memory's own incremental-observation flush (see [[implementation-decisions#crash-resilience|crash resilience]]) already promotes small in-session facts directly rather than parking them in a second buffer someone has to remember to empty correctly. **Reject.**
- **Knowledge graph / structural extraction** (agentmemory, `src/functions/graph.ts`): confirmed real and cheap (a deterministic cross-product over already-tagged concepts/files, no LLM by default), but it answers a question x-memory doesn't ask — "how do these memories relate to each other" — rather than "what's the current recap for this one project." **Reject, already covered by [[out-of-scope]].**
- **Full orchestration layer** — `frontier`/`leases`/`sentinels` (agentmemory, `src/functions/{frontier,leases,sentinels}.ts`): all confirmed real and fully implemented, but built for concurrent agents contending over a shared task graph — lock leases, dependency-gated runnable-action computation, condition watchers. x-memory has one user, one machine, and (per [[implementation-decisions#concurrent-write-resolution|concurrent-write resolution]]) no lock contention to arbitrate; there is nothing here to lease. **Reject.**
- **Sleep/consolidation as a scheduled background job** (hippo-memory, `src/scheduler.ts`): the mechanism itself is out of scope (see [[out-of-scope]] — no daemon, no cron), but its `--dry-run` prints the exact same counts a real run would produce without writing anything, confirmed live. **The mechanism is rejected; the dry-run-shows-real-numbers habit is worth keeping** for whatever prune step [[implementation-decisions#pruning-policy|pruning policy]] eventually ships as.

## A terminology note

agentmemory uses "handoff" for the single-session forward-looking view and "recap" for the multi-session rollup — the reverse of how this spec already used those two words (see [[glossary]]: here, "handoff" names the act of a session ending, "recap" names the one current artifact for a project). Rather than rename existing, already-referenced terms mid-spec, [[glossary#rollup|rollup]] was introduced as the new term for agentmemory's "recap" concept, and this spec's "recap"/"handoff" keep their original meanings. Anyone cross-referencing agentmemory's own docs later should expect this collision and not assume the words mean the same thing in both places.
