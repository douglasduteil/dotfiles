---
name: x-commit
description: Write a git commit with a gitmoji subject and a short, human Problem/Proposal body, split into atomic commits when the diff mixes concerns. Fixed personal convention, every repo. Use for "/x-commit", "commit this atomically", or gitmoji + Problem/Proposal style regardless of repo history.
user-invocable: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# x-commit

Fixed style, every repo. Repo CONTRIBUTING.md demands otherwise → say so, ask.

## 1. Split into atomic commits

One concern per commit. `git status` + `git diff` (staged + unstaged), group
hunks by concern. More than one → propose split (commits + file/hunk sets)
before any message. Stage per commit with `git add <files>` or `git add -p`.

## 2. Subject

`<emoji> <imperative, lowercase, no trailing period>` — one emoji, picked by
what commit does:

| emoji | for |
|---|---|
| ✨ | feature |
| 🐛 | bug fix |
| ♻️ | refactor |
| ⚡️ | performance |
| 🔥 | remove code/files |
| 📝 | docs |
| ✅ | tests |
| 🔧 | config/tooling |
| 💄 | UI/style |
| 🚨 | lint/warnings |
| ⬆️ / ⬇️ | dependency bump/downgrade |

Title names the change itself: "fix X", no filenames, no versions unless
version is the change.

## 3. Body: Problem / Proposal, written for a colleague

Write the body the way you'd explain the change to a teammate: plain, full
sentences, calm and factual. Each section is **one or two short
sentences**. Problem = what went wrong and who or what it affected.
Proposal = what this change does about it and why this approach. Diff
already shows *what*; body carries *why*. Exact identifiers stay exact, in
backticks.

Tone: describe the code and its behaviour ("the handler drops the retry
header"), with neutral verbs (misses, skips, can drop). Credit the
previous approach where it made sense ("worked until X").

```
**Problem**
`Ctrl-d` and `Ctrl-a` were mapped in normal mode, so half-page scroll and number increment stopped working everywhere.

**Proposal**
Bind them to Visual Find and Visual All instead. They only apply in visual mode, so normal mode keeps its defaults.
```

Lists of items (packages, deny rules) → name the category, not each item.
Needs more than two sentences per section → body too big, or commit not atomic.
Trivial commit (typo, one config value) → subject only.

Body speaks only about codebase. Leave out `.agents/` paths, skill/agent
names, session narrative, and verification lines ("Checked locally: …",
test counts, "tests pass") — those go in chat, never in the commit or
the PR description.

Internet-sourced claim → add `Source: <url> (consulted YYYY-MM-DD)` under
its section.

## Workflow

1. Split per §1.
2. Per commit: stage, draft subject + body.
3. Print exact command before running — some repos sign with hardware key,
   user needs it ready:

   ```
   git commit \
     -m "<emoji> <title>" \
     -m "**Problem**
   <line>" \
     -m "**Proposal**
   <line>"
   ```

4. Session git-safety rules hold: commit only when asked, no `--no-verify`,
   no amend unless asked, no attribution lines.
