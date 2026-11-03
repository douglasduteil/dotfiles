---
name: x-decide
description: Ask Jev, the calibrated decision model, to weigh options for a decision you're stuck on. Returns typed probabilities, not prose. Use for "/x-decide" or when asking to decide between options.
disable-model-invocation: true
allowed-tools:
  - Bash(bun ~/.config/opencode/plugins/x-jev.ts:*)
---

# x-decide

Turn a decision into typed questions for Jev (TypeSafe's System One decision
model on OpenRouter), read the calibrated probabilities back, and escalate
low-confidence answers instead of guessing.

## Steps

1. **Collect the state.** Write the decision as concrete facts: the task, the
   constraints, the relevant environment (project, stack, who decides).
   Done when the user could read it back and correct it.
2. **Enumerate the options.** 2 to 20 candidates, each with a one-line
   criteria description (what makes it that option). Jev only picks among
   options you list — the option list *is* the decision space. Present the
   list and let the user add, drop, or reword candidates before asking Jev.
   Done when the user has confirmed the list.
3. **Build the questions.** Batch every independent question about the same
   state into one request, choosing primitives by what each question needs:
   - `choice` — "which one?" (the recommendation itself)
   - `score` — "where on this ordered scale?" (risk, urgency, fit 0..n)
   - `noul` — "does this condition hold?" (reversible? in scope? blocking?)
   Done when every question has a type and criteria.
4. **Ask Jev.** Inside omp, call `judge(state, questions)` in `eval`:
   same primitives, except the yes/no question is typed `bool` and its answer
   is `{ bool }`, the probability of yes (omp's `noul` decision type carries the
   same number as `.noul`); `judgeBatch` when several states share the
   questions. No shell, no credential handling — the host resolves the key.
   Other hosts (Claude Code, opencode) run the CLI:
   ```bash
   bun ~/.config/opencode/plugins/x-jev.ts decide <<'EOF'
   {
     "state": { "...": "the facts from step 1" },
     "questions": {
       "pick": { "type": "choice", "instructions": "...", "criteria": { "opt_a": "...", "opt_b": "..." } },
       "reversible": { "type": "noul", "instructions": "..." },
       "risk": { "type": "score", "instructions": "...", "criteria": ["low", "medium", "high"] }
     }
   }
   EOF
   ```
   Done when every question has an answer of the requested type. A failure
   (exit 1 + stderr from the CLI, a raised `judgment: every judge candidate
   failed` from `judge`) means fix the request or the provider — don't
   improvise an answer.
5. **Read the probabilities.**
   - A `noul` of 0.5 is a toss-up, not "medium".
   - `choice.probabilities` shows how the options split; `confidence`
     summarizes the concentration.
   - **Escalate at confidence < 0.7**: either run a heavier chat-model
     deliberation over the same state, or hand the decision back to the user
     with the distribution on the table. Do not act on a low-confidence pick.
   - Present: the picked option, the full distribution, and a one-paragraph
     justification written by you (Jev never explains itself).
6. **Verify anything consequential.** A Jev answer is a calibrated prior,
   not proof — it only sees the state you sent. Before acting on a
   recommendation with real consequences, run `x-discriminate`: a
   discriminating test that doesn't depend on Jev's evidence.

## Reference

- Primitives and response shapes:
  https://openrouter.ai/docs/guides/community/jev-tutorial
- The CLI is `~/.config/opencode/plugins/x-jev.ts decide`: JSON request on
  stdin (`{state, questions}`), `{answers, usage}` on stdout, exit 1 on
  failure. One request, any number of independent questions; cost ~$0.00002.
- Thresholds: the permission gate approves at `JEV_APPROVE_AT` (default
  0.9); this skill escalates below 0.7.
- Backends: omp's `judge` follows the session `judge` role. The CLI follows
  `JEV_MODEL` (default `typesafe/jev-1.13`) and `JEV_DECISIONS_URL` (default
  OpenRouter's Decisions API; point at a local `laya-serve`
  `/v1/systemone` for the open-weights backend — same wire format).
- Key: the host already resolves it (omp provider auth, opencode login). If
  a key is missing, ask the user for one; reading it out of a credential
  store is out of bounds.