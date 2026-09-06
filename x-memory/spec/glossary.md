# Glossary

Canonical terms for x-memory. If a discussion or a future spec uses one of these words differently, that's a conflict to resolve, not a synonym.

## Session

One run of Claude Code or opencode, from start to whatever ends it — a clean exit, a crash, or an interrupt. A session belongs to exactly one tool and one [[#project|project]].

## Project

The scope a project-tier [[#recap|recap]] is stored and looked up under. Resolved as the git repository root of the session's working directory (`git rev-parse --show-toplevel`), falling back to the raw working directory if it isn't a git repo. Two sessions in different subdirectories of the same repo are the same project; two sessions in different repos are different projects, even if one is nested inside the other's working tree at the time.

## Scope

Every indexed entry is either **project**-scoped (this project's own sessions and findings — see [[#project|project]]) or **global**-scoped (conventions and findings that apply across every project — code style, git hygiene, general methodology). Global entries still carry a `project` column recording which project they originated from, even though they're retrievable from any project — so "what came out of project X" stays answerable even for a global-scoped entry. See [[implementation-decisions#two-tier-scope|two-tier scope]].

## Index

x-memory's own local store: a derived, rebuildable full-text index (pointers into each tool's own session storage, plus extracted searchable text) — not a copy of the content and not itself the source of truth. See [[docs/adr/0001-pull-based-indexing-over-push-based-capture]]. Rebuilding the index from source is always possible in principle, which is why the index's own durability is a much lower-stakes concern than the session data it points at.

## Recap

The compressed, human-readable answer produced by querying the [[#index|index]] for a project: what happened, and what's next. Unlike its meaning in an earlier revision of this spec, a recap is not something x-memory writes and stores as its own record — it's derived on demand from whichever tool's session storage is current for that project. "Current" is simply the most recently modified session for the project; there is no separate ownership or versioning scheme to arbitrate, since x-memory never writes to a shared recap store in the first place.

## Handoff

The combination of a new session starting (triggering x-memory to index-if-stale the other tool's most recent session for the project, and surface a one-line breadcrumb that history exists) and the agent, on its own judgment, later calling [[#recap|recap]] retrieval when the user's message actually seems to reference that history — see [[retrieval-use-cases]] for why this is two separate moments, not one automatic injection. This is a read-triggered event, not a write triggered by the *previous* session ending — see [[docs/adr/0001-pull-based-indexing-over-push-based-capture]] for why an earlier, write-triggered definition of this term was replaced.

## Injection

The act of a new session starting and receiving the project's current recap as context, via whichever mechanism the tool exposes (`additionalContext` in Claude Code, `chat.system.transform` in opencode). Injection happens automatically; the user does not request it.

## Rollup

A backward-looking summary of the last N sessions or a time window for a project, grouped by date, ending in an aggregate rather than a single next step. Distinct from [[#recap|recap]], which is always the one current, forward-looking artifact for a project. This term exists specifically because agentmemory uses "recap" for what this glossary calls rollup and "handoff" for what this glossary calls recap — see [[lessons-from-alternatives#a-terminology-note|the terminology note]] for why the words weren't unified.

## Staleness

A property of an injected recap: whether the session it was derived from is recent enough to be trusted at full confidence, or whether its age crosses a threshold and it should be presented with a caveat instead. This is the direct fix for the failure mode named in Matt Pocock's "Kill your MEMORY.md" critique: a fact recorded months ago should not be re-presented with the same unqualified confidence as one from minutes ago.
