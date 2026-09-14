---
name: x-research
description: Coordinate resolution of an open technical question via a persistent hypothesis tree cached under `.agents/x-research/`, testing each hypothesis with `x-discriminate`'s proof-independent-of-evidence discipline instead of assumption. Use for "research X", an ambiguous root cause worth a durable trail, or any hypothesis-ambiguity situation where the answer should survive past this session. Not for a quick one-off comparison with nothing worth persisting — that's plain `x-discriminate`.
user-invocable: true
argument-hint: <question or problem>
---

# x-research

A lighter, in-repo replacement for the "Arbor" plugin: same hypothesis-tree discipline, none of the coordinator/executor weight.

1. Read `.agents/x-research/index.md` (format below) if it exists. Check whether the question matches an existing branch before opening a new one — the index is the cache; don't re-litigate a resolved or already-scored branch from scratch.
2. Run `x-discriminate`'s candidate/axis/test/tripwire loop for the branch's hypotheses — don't reimplement it here.
3. Where that loop calls for running the discriminating test, run it as a **fork** (`Agent` tool, `subagent_type: "fork"`) per hypothesis — cheap because it shares the coordinator's prompt cache and inherits context, and it keeps the fork's exploration noise out of this session; only the verdict comes back.
4. If a hypothesis's test requires file mutation, the fork works in `/tmp/x-research/<project-path-id>/<mktemp-id>/`, never the real working tree. Derive `<project-path-id>` once from the project's git root (stable short hash/slug) so the scratch path is stable across sessions for the same project.
5. Every branch gets its own `.agents/x-research/<branch-slug>.md` from the start — the fork's reasoning, evidence, and discriminating test live there, never in the index. Merge each verdict into `index.md` as one tree line (format below): score, status, one-line insight, wiki-linked to the branch file.
6. If a resolved branch's insight is durable cross-session knowledge, propose adding it to `.agents/memory/index.md` via `x-curate-memory`'s existing confirm-before-write rule — that, not x-memory ingestion, is how this gets "indexed."

Completion: the branch reaches confirmed/refuted/stalled and `index.md` reflects it — not "investigated enough."

## index.md format

Compact summary tree, never the evidence itself — one line per branch/hypothesis, wiki-linked to the branch file that holds the actual reasoning:

```
ROOT (baseline: 20%)
├── 1: Retrieval optimization        [insight: "retrieval quality is the bottleneck"](1-retrieval-optimization.md)
│   ├── 1.1: Constraint decomposition + verification   [40%, merged]
│   ├── 1.2: Periodic re-read injection                [40%, pruned — no net gain]
│   └── 1.3: Answer-extraction tuning                  [35%, pruned]
├── 2: Multi-perspective search      [insight: "search scaffolding hurts here"](2-multi-perspective-search.md)
│   └── 2.1: Breadth-first search                      [25%, pruned]
└── 3: Code-level intervention       [insight: "code-level > prompt-level"](3-code-level-intervention.md)
    ├── 3.1: Continuation injection                    [70%, merged]
    └── 3.2: ANSWER-tag extraction                     [45%, done]
```

Status values: untested, testing, confirmed, merged, pruned, stalled, done.

Reuse `x-discriminate` for the candidate/axis/test/tripwire mechanics; this skill only adds the persistence layer and the fork-per-hypothesis execution model.
