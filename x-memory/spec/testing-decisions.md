# Testing Decisions

## What a good test looks like here

A test dispatches actions at the reducer (see [[implementation-decisions#module-the-reducer|the reducer]]) and asserts on the resulting state or the derived recap/staleness output — never on internal representation details like exact JSON key order or file-write timing. The reducer is pure, so this needs no mocking, no fake clock library (the prototype's `clock` field is already a plain number the test controls directly), and no real Claude Code or opencode process.

## Prior art

The Bun CLI prototype (`handoff-cli.prototype.ts`, since deleted as throwaway per the prototype workflow, but its scenario list is the primary source) already encodes exactly this style: a `scenario <name>` runner that resets state, applies a fixed sequence of actions, and prints the state after each step for inspection. Its original six scenarios targeted the push-based design; [[docs/adr/0001-pull-based-indexing-over-push-based-capture|the later pivot to pull-based indexing]] resolved two of them (crash, concurrent sessions) by construction rather than by a mechanism to test — they're kept below as regression tests that the resolution holds, not as tests of a capture mechanism that no longer exists. The real test suite:

1. Happy path — a fake "source session" for opencode exists with recent activity; Claude Code's `index` then `query` returns a recap built from it.
2. Reverse direction — same, opencode indexing a Claude Code source session.
3. Crash regression — a source session with no clean end (however that's represented by the fake source-session fixture) still produces a recap on `query`, because indexing never depended on a clean end in the first place; this test exists to catch a future regression back toward capture-based design, not to validate a flush mechanism.
4. Wrong project — an indexed session under project A is never returned by `query` for project B.
5. Stale recap — a source session older than the threshold is still returned by `query`, but flagged; one younger than the threshold is not.
6. Concurrent sessions regression — two source sessions for the same project (one per tool) with close timestamps: assert `query` returns the one with the later `session_modified_at` and both remain present in the index, rather than one being lost — again a regression guard, not a test of merge logic, since there's no merge logic to test.
7. Reject — a rejected entry is excluded from `query`'s result even after `index` re-runs over the same underlying (unchanged) source session.
8. Pin — a pinned entry is never returned with the staleness flag, regardless of `clock`.
9. Rollup — given several source sessions across different dates for one project, the rollup query groups them by date and returns all of them, distinct from `query`'s single-current-entry result.

## What gets tested outside the reducer

The read-side hook shells (Claude Code's `SessionStart` script, opencode's `chat.system.transform` handler) are thin enough that they should not need their own scenario coverage beyond a smoke check that they call `index` then `query` and write the result to the expected hook-output field (`additionalContext`, or `output.system[]`). The stable-interface constraint (see [[implementation-decisions#reading-through-stable-interfaces-hard-constraint|reading through stable interfaces]]) is worth one dedicated test of its own — a mocked "the source tool's API response shape changed" test would have caught the opencode storage migration found mid-investigation (see [[further-notes#opencodes-storage-format-changed-mid-investigation|further notes]]) before it could silently break anything. The scope constraint (see [[implementation-decisions#scope-constraint-hard-constraint-not-a-preference|scope constraint]]) does need its own explicit test, covering both directions: given a target directory, assert the installer never *writes* outside it plus the two named global config files, and assert no x-memory command ever *reads*/imports from a path the user didn't pass it — `hippo-memory` was live-verified to violate both, independently, so both are worth a dedicated regression test rather than just careful code review.

## Modules tested

- The reducer (core, exhaustive scenario coverage as above).
- The scope-constraint check (write and read directions, one focused test each).
- The stable-interface boundary (one test guarding against raw-format parsing).
- Everything else (the two read-side hook shells) — smoke-level only, per the "thin shell calls into the pure module" design in [[implementation-decisions]].
