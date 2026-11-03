# Glossary

The wiki's own vocabulary. Use these meanings when writing a page or a skill. Where a
term has an owner document, that document is authoritative: this page names the
concept and points at the owner, it never redefines it.

## Memory structure

- **Tier** — the wiki a memory belongs to: project, global, or machine-only. Session
  history is not a tier; it is an index of transcripts.
- **Scope** — the index store a command touches: `--scope project` is
  `<project>/.agents/x-memory/index.db`, `--scope global` the XDG-cache one. Tier and
  scope are different axes: a tier is a wiki location, a scope is a database.
- **Page** — one curated Markdown file inside a tier.
- **Entry** — one indexed session record. `x-memory` returns entries; routers point at
  pages.
- **Router** — a folder's bare `index.md`, at any depth: a list of trigger lines, read
  whole, then exactly one child followed. It summarizes nothing. A router may route a
  subfolder's `index.md`, which routes its own pages the same way.
- **Trigger line** — the "before X" clause on a router entry, the only thing deciding
  whether the page gets opened.
- **Breadcrumb** — the session-start line reporting how many sessions are indexed and
  how recent the newest one is.
- **Lead** — a session-history hit that may answer the question. It becomes a fact only
  when read in the source.
- **Publication test**, **essence**, **values**, **elevation**, **demotion** — owned by
  the `x-memory-curate` skill.

## Participants

- **Owner** — the user. Authority comes only from the owner's message in the current
  conversation (Constitution Art. I.3).
- **Main session** — the top-level conversation: it delegates, reviews and commits.
- **Delegate**, **fork** — a subagent given a brief. Its report is a lead, never proof.
- **Guard**, **guard configuration**, **credential store** — the meanings in
  Constitution Article I.4 apply verbatim; no looser sense.
