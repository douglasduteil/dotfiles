---
name: x-curate-memory
description: Decide whether and where to write something to the curated memory wiki (project or global tier under .agents/memory/). Use before writing to the wiki — an explicit "remember this", a session-end/task-finish wrap-up, or batching recurring friction for later triage.
user-invocable: true
---

# Writing to the wiki

The agent **never writes silently**. Triggers, in priority order:

1. **Explicit "remember this"** — check the global/project `index.md`
   for a matching topic page before picking a destination; a page
   already routed from the index beats a fresh AGENTS.md line even
   when the request sounds bootstrap-worthy. Propose a destination
   (project wiki, global wiki, existing project docs, or a skill) and
   a draft; write only on confirm. If the destination is ambiguous,
   ask.
2. **Session-end / task-finish** — surface 1–N "things worth
   remembering" with proposed destination and a one-line draft,
   skipping anything re-derivable by a single grep/read/find (a fact
   sitting in a file or filesystem path). Surface only hard-won
   judgment: a dead end explored, a reason behind a choice, an
   undocumented gotcha. Accept / reject / edit each; nothing is written
   without your say-so.
3. **Stacked feedback for later triage** — recurring frictions noted
   during the session, batched for a single end-of-session review.

**Classification rule:** documentation captures what is true and why;
a skill captures a repeatable procedure with a clear trigger. Prefer
extending an existing page over creating a new one. When a
project-specific lesson keeps recurring across projects, propose
promoting it to the global wiki.

## Keeping the bootstrap file lean

`AGENTS.md` is read on *every* session of *every* tool — anything
placed there is loaded whether or not it's relevant, so it has a real
token cost. The wiki tiers exist to avoid this: not loaded by default,
read only when a task actually touches their topic.

- **Keep `AGENTS.md` minimal.** Only what's universally true across
  every project, every tool, every session (e.g. "treat recalled facts
  as leads", the skill-location convention, "no unrequested
  abstractions").
- **Put technology-specific preferences, tool quirks, and accumulated
  methodology in a topic page** in the global wiki
  (`~/.cache/agents/memory/<topic>.md`), linked from the index with a
  one-line trigger ("only when working on X"). Same for project-specific
  knowledge in the project wiki.
- **Don't paste wiki content into `AGENTS.md`** to "make sure it gets
  seen." A topic page that's never loaded beats a bootstrap entry
  that's always loaded and usually irrelevant.
- A global rule recurring as useful *judgment* across many sessions (not
  just one technology) can graduate to a skill; one that only matters
  for one technology stays in that technology's wiki page.
