---
name: x-memory-curate
description: Decide whether and where to write something to the curated memory wiki (project tier under .agents/x-memory/, global tier under ~/.config/agents/x-memory/). Use before writing to the wiki — an explicit "remember this", a session-end/task-finish wrap-up, or batching recurring friction for later triage.
user-invocable: true
---

# Writing to the wiki

Wiki tiers: project `<project>/.agents/x-memory/`, global `~/.config/agents/x-memory/` (tracked in the public dotfiles repo), and *local* `~/.local/share/agents/x-memory/` for pages holding secrets, fingerprints, hostnames, drive letters or private repo names — outside the repo, routed by its own `index.md`. The session index is a separate store — project scope beside the project pages, global scope in the XDG cache — and `x-memory` never writes over a curated page. Revised 2026-10-06: the global tier moved from `~/.cache/agents/x-memory/` to the tracked path, private pages to `~/.local/share/agents/x-memory/`.

## The publication test: which tier

The global tier is a public blog: `agents/.config/agents/x-memory/` is committed to a
public dotfiles repo, so every page is read by strangers, crawled, and served as is.
Judge each page against three gates:

1. **Anonymous** — every concrete value is either already public (a package name, a
   tool version, an upstream URL, a `~`-relative path a stranger could recreate such
   as `~/.ssh/github.pub`) or replaced by its role: *the hardware signing key*,
   *the photos drive*, *the client repo*, *the sibling worktree*. A key handle file
   name, a serial, a fingerprint or an account id is never generic. A stranger
   reading the page learns the lesson, never the setup.
2. **Machine-independent** — still true and useful on a fresh machine of yours. A
   reference that only makes sense on one host fails this gate.
3. **Reusable** — earns its place on more than one machine *and* more than one project.

All three gates pass → global tier, drafted so a stranger could follow it. Any gate
fails → local tier. Project-specific but shareable → project tier, which is gitignored
and unpublished, so gates 1 and 2 do not apply there — a credential still never
appears in any tier.

## One session, several destinations

A session on one subject usually yields several entries across tiers, not one page.
Split before drafting:

1. **Harvest candidates** — every judgment worth keeping: a rule, a reason, a gotcha,
   a fact about a repo, a concrete value.
2. **Test each candidate alone**, not the session as a whole: one line can be public
   while its neighbour is machine-bound.
3. **Split, never merge.** Essence — rule, reason, generic command — goes global.
   Values — key path, serial, hostname, drive letter, repo or client name — go local,
   under the role the public page uses for them. A project-bound instance (this stack,
   this schema, this deploy) goes to the project tier. Session narrative goes nowhere;
   it stays in the session index.
4. **Draft one entry per destination, each with its own page and index line**, and
   propose the batch in one go: one confirmation lands them all, and rejecting one
   tier leaves the others standing.

Done when every candidate has exactly one tier and one index line. A candidate that
needs two is two entries.

Links run one way: a local page may reference a public one; a public page points at no
local file, because a reader on another machine has none. Elevation and demotion are
this same split applied to an existing page — essence up, values down.

Worked example, one session: a container's default trigger fires on every click →
public gotcha in the topic page; the drive letter and mount command → the local page;
the click-path bug in this particular stack → project tier; "it took an hour" →
nowhere.

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
   during the session, filed for a single end-of-session review (see
   Feedback log below).

## Classification: kind decides home

Sort every memory by **mode** first, then by kind:

- **Normative**: the user's choice. Changes only by decision; never
  expires on its own.
- **Descriptive**: how a tool or system behaves. Every line carries the
  tool version and date; re-verify or delete it on upgrade.

| Kind | Home | Loaded by |
| --- | --- | --- |
| Invariant: every session, every project | `AGENTS.md` / `rules/` | always |
| Doctrine: many linked normative rules for one technology | reference skill | description, plus a path rule where the harness has one |
| Procedure: ordered steps with a trigger | skill | description / slash command |
| Preference: one normative rule | wiki topic page | `x-conventions` router |
| Gotcha: verified tool behaviour | wiki tool page, version-stamped | `x-conventions` router |
| Decision and its reason | `.agents/docs/adr/` | on demand |
| Episode: what happened in a session | `x-memory` session index | `x-memory query` |
| Tutorial for the human | outside agent load paths | never |

- One normative owner per technology: once a doctrine skill exists, it
  absorbs every preference on that technology.
- A gotcha needed to apply one doctrine rule lives beside that rule;
  every other gotcha lives in the wiki.
- A page that names a skill points to it; it never restates it.
- Keep modes apart on a page: normative lines are pruned by decision,
  descriptive lines by version.
- Prefer extending an existing page over creating a new one. When a
  project-specific lesson keeps recurring across projects, propose
  promoting it to the global wiki.

## Feedback log

One file per friction: `.agents/x-memory/feedback-<name>.md`, not a
shared running log — each entry is its own triage unit, deleted once
treated rather than accumulating as sediment. Every file starts with
session id and date, so a stale entry is identifiable at a glance:

```
## <one-line friction summary>

- Session: `<session-id>`
- Date: <date>

<what happened, why it's friction>
```

Treating an entry means folding its insight into the real
destination (a wiki page or `AGENTS.md`) and deleting the file — never
leave a resolved entry behind "for the record."

## Keeping the bootstrap file lean

`AGENTS.md` is read on *every* session of *every* tool — anything
placed there is loaded whether or not it's relevant, so it has a real
token cost. The wiki tiers exist to avoid this: not loaded by default,
read only when a task actually touches their topic.

- **Keep `AGENTS.md` minimal.** Only what's universally true across
  every project, every tool, every session (e.g. "treat recalled facts
  as leads", the skill-location convention, "no unrequested
  abstractions").
- **Put tool quirks and single preferences in a topic page** in the
  global wiki (`~/.config/agents/x-memory/<topic>.md`, or *local* when
  private), linked from the index with a one-line trigger ("only when
  working on X"); a technology with a doctrine skill keeps its
  preferences in that skill (see Classification). Same for
  project-specific knowledge in the project wiki.
- **Don't paste wiki content into `AGENTS.md`** to "make sure it gets
  seen." A topic page that's never loaded beats a bootstrap entry
  that's always loaded and usually irrelevant.
- A global rule recurring as useful *judgment* across many sessions (not
  just one technology) can graduate to a skill; one that only matters
  for one technology stays with that technology's doctrine skill, or its
  wiki page when it has none.
