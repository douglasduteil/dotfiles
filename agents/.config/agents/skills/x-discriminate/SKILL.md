---
name: x-discriminate
description: Admit one candidate among several viable designs, fixes, or refactors using a discriminating test independent of whatever evidence produced them; treat a surprising result as a signal the model is wrong, not a special case to patch around. Use when 2+ approaches are consistent with what's been observed so far and no single one is obviously correct — including a second fix attempt for a symptom the first attempt didn't resolve, even if no one named it a "candidate" yet (architecture/library/fix choice, competing bug hypotheses, an unexpected test result). Not for a single hidden mechanism to uncover — that's investigate-first / diagnosing-bugs.
---

# Discriminate between candidates

1. Name the candidates. 2-4. Candidates don't have to arrive as a batch — a fix attempt that failed is candidate #1; whatever you're about to try next for the same unresolved symptom is candidate #2. Count both, even mid-debug. More than 4: the real problem is you haven't narrowed the design space, not that you need a bigger comparison — cut early on obvious cost/fit and drop the rest.
2. State the one axis the candidates actually differ on (perf, coupling, blast radius, an edge case one handles and the others don't). If they don't differ on anything that matters, there's nothing to discriminate — pick either and move on.
3. Construct one discriminating test aimed at that axis: the smallest edge case, boundary condition, or concurrency scenario that would split the candidates apart. Not "write more tests" generically — a test that can't produce different verdicts for different candidates discriminates nothing.
4. The discriminating test must be independent of whatever evidence produced the candidates. Re-scoring them against the same observations that generated them isn't proof, it's restatement — a dev/test split for the comparison itself.
5. Run it. Admit the winner on that result alone, not on how elegant either candidate looked going in.
6. Tripwire: after 2 rounds of candidates failing to clearly beat the current baseline or each other, stop generating variants. Reframe the problem or surface the impasse to the user — a 3rd variant rarely succeeds where two didn't.
7. A surprising result (the discriminator picks the "wrong" one, an unrelated test breaks) indicts the model, not the code. Before patching a special case, ask what assumption about the system or requirement was wrong.
