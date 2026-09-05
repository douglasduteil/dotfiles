# User Stories

Terms below use the [[glossary]] definitions. "The user" is a single developer working solo across both tools on one machine; there is no multi-user scenario in scope (see [[out-of-scope]]).

## Core handoff

1. As a user, I want ending a Claude Code session to write a recap of that session, so that I don't have to manually summarize what I did before switching tools.
2. As a user, I want starting an opencode session in the same project to know a Claude Code session happened here before — at minimum, that it exists and roughly how recent — so that I don't open a session that's silently ignorant of my own recent work, without it dumping a full recap on me before I've even said what I want.
3. As a user, I want the reverse to work too — an opencode session's history being knowable from Claude Code — so that the tool I happen to reach for first doesn't matter.
4. As a user, I want the handoff to require nothing from me beyond normal use of either tool, so that I never have to remember to run a command to "save my place."
5. As a user, I want to be able to explicitly ask "what was I doing?" (a cold recall) and get the same recap a fresh session would have been given, so that I can check my own status without starting a whole session.

## Correctness of scope

6. As a user working on two different projects in one day, I want each project's recap kept separate, so that opening project B never shows me leftover context from project A.
7. As a user, I want a project to be recognized by its git repository root, not by the exact subdirectory I happened to `cd` into, so that starting a session two folders deep still finds the right recap.
8. As a user, I want a brand-new project with no prior sessions to start cleanly with no recap and no error, so that first use isn't broken use.

## Resilience

9. As a user who closes a terminal, hits Ctrl-C, or otherwise doesn't type an explicit exit command — confirmed to be a termination path Claude Code's own docs say isn't guaranteed to fire a clean end-of-session hook, and plausibly how most sessions actually end — I want as much of that session's real work as reasonably possible to still be visible to my next session, so that the ordinary way I stop working doesn't quietly erase my context.
10. As a user who accidentally has both tools open on the same project at the same time, I want both sessions' work reflected in the eventual recap rather than one silently overwriting the other, so that whichever tool I close second doesn't quietly destroy what the other one did.
11. As a user, I want the recap injection to fail safely if x-memory itself is broken or misconfigured, so that a bug in this tool never blocks me from starting a normal Claude Code or opencode session.

## Trust and staleness

12. As a user returning to a project after a long gap, I want the recap to still be shown, but clearly marked as possibly outdated, so that I don't treat a stale assumption as current fact.
13. As a user returning to a project the same day, I want the recap shown with no staleness caveat, so that fresh, accurate context isn't needlessly hedged.
14. As a user, I want the staleness threshold to be a single, known, adjustable value, not a hidden heuristic, so that I can reason about when a recap will and won't be trusted.

## Accuracy of content

15. As a user coming out of a long, branchy session (many sub-tasks, many tool calls), I want the recap to reflect the actual decisions made, not just the last message or a generic "worked on the project" filler, so that the handoff is actually useful.
16. As a user, I want the recap to read as a short, human summary and a concrete next step, not a raw dump of every observation captured during the session, so that I can absorb it in a few seconds.

## Installation and removal

17. As a user, I want installing x-memory to only touch this project's and my user-level Claude Code/opencode config, never a config file outside the scope I asked it to touch, so that a broad install command can't silently rewrite unrelated global state. (This is a direct, verified lesson from testing `hippo-memory`'s hook installer — see [[alternatives-evaluated]].)
18. As a user, I want to be able to see exactly what an install would change before it changes it (a dry-run), so that I can review before committing.
19. As a user, I want to be able to fully remove x-memory — its hooks, its config entries, its stored data — and have nothing left behind, so that trying it isn't a one-way door.
20. As a user, I want any new skill, command, or agent name x-memory introduces that collides with an existing one to be prefixed `x-`, so that personal tooling never silently shadows a plugin-provided one.

## Operational transparency

21. As a user, I want to be able to inspect the current recap for a project directly (not just have it injected), so that I can debug or sanity-check what x-memory thinks is true.
22. As a user, I want x-memory to make no network calls by default, so that a memory tool doesn't become an unexpected data-exfiltration or cost surface.
23. As a user, I want x-memory to run with no persistent background daemon, so that it doesn't add a process, a port, or an extra thing that can silently die and need restarting.

## Correction and precision

24. As a user who notices an injected recap contains a wrong fact, I want to reject it and have it never resurface — even if the same underlying session would otherwise get re-indexed — so that one bad extraction doesn't keep haunting every future session.
25. As a user with a fact I always want treated as current (e.g. "this repo uses pnpm, not npm"), I want to pin it, so that it's never shown with a staleness caveat regardless of age.
26. As a user, I want to be able to ask for a rollup of the last several sessions on a project, grouped by date, separately from the single forward-looking recap that gets injected automatically, so that "what was I doing five minutes ago" and "what have I been doing on this project this week" are two different, non-conflated answers.

## Human review

27. As a user, I want a plain, git-diffable Markdown file per project that summarizes recent sessions, so that I can review my own project history the normal way — opening a file and reading prose — instead of only through a query tool.

## Cross-project conventions

30. As a user with a consistent code style, git hygiene, and work methodology across every repo I touch, I want that captured once at the global tier rather than re-derived or re-explained per project, so that starting work in a new or unfamiliar repo doesn't mean starting from zero on how I like to work.
31. As a user, I want to be able to see which project a global-scoped convention originally came from, so that "why do I do it this way" has a traceable answer instead of an opaque rule with no history.
32. As a user, I want to filter what gets retrieved by project — this project only, global only, or both — so that a query about "how do I structure commits" isn't drowned in unrelated project-specific session history, and a query about "what happened in this project" isn't drowned in general conventions that apply everywhere.

## Retrieval judgment

28. As a user, I want the agent to decide when my message references past work and pull the relevant history itself, rather than me having to run a recall command by hand or having every session start flooded with context I didn't ask for.
29. As a user, I want anything recalled from a past session presented as a lead to verify, not as settled fact, so that a stale or superseded finding doesn't get treated with the same confidence as something the agent just confirmed itself this session.
