---
name: x-commit
description: Write a git commit with a gitmoji subject and a caveman Problem/Proposal body, split into atomic commits when the diff mixes concerns. Fixed personal convention, every repo. Use for "/x-commit", "commit this atomically", or gitmoji + Problem/Proposal style regardless of repo history.
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

## 3. Body: caveman Problem / Proposal

Body is **caveman**: drop articles, filler, hedging. Fragments. Each section
**one line, 20 words max**. Problem = what broke + consequence. Proposal =
fix mechanism + why this approach. Diff already shows *what*; body carries
only *why*. Exact identifiers stay exact.

```
**Problem**
Ctrl-d/Ctrl-a maps permanent in normal mode. Broke half-page scroll and increment everywhere.

**Proposal**
Bind to Visual Find/Visual All instead. Visual-mode only, normal mode untouched.
```

Lists of items (packages, deny rules) → name the category, not each item.
Why not fitting one caveman line → body too big, or commit not atomic.
Trivial commit (typo, one config value) → subject only.

Body speaks only about codebase. Leave out `.agents/` paths, skill/agent
names, session narrative, verification logs (tests passed etc.) — those go
in chat/PR.

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
