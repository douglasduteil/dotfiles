---
name: x-commit
description: Write a git commit with a gitmoji subject and a short Problem/Proposal body, split into atomic commits when the diff mixes concerns. Fixed personal convention (not derived per-repo, unlike commit-message). Use for "/x-commit", "commit this atomically", or when the user wants gitmoji + Problem/Proposal style regardless of the repo's own history.
user-invocable: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# x-commit

Fixed style, every repo, no derivation step. If a repo's own
CONTRIBUTING.md demands something else, say so and ask — don't silently
switch to `commit-message`'s derive-from-history approach.

## 1. Split into atomic commits

One logical change per commit. Run `git status` + `git diff`, group
hunks by concern. More than one concern → propose the split (list of
commits, each with its file/hunk set) before writing any message. Use
`git add <files>` or `git add -p` per commit, never a blanket `git add -A`.

## 2. Subject: gitmoji + short imperative title

`<emoji> <imperative, lowercase, no trailing period>`

Pick the emoji by what the commit actually does — pick one, don't stack:

| emoji | for |
|---|---|
| ✨ | new feature |
| 🐛 | bug fix |
| ♻️ | refactor, no behavior change |
| ⚡️ | performance |
| 🔥 | remove code/files |
| 📝 | docs |
| ✅ | tests |
| 🔧 | config/tooling |
| 💄 | UI/style-only |
| 🚨 | lint/warning fixes |
| ⬆️ / ⬇️ | dependency bump/downgrade |

Title states the change, not the ceremony around it — "fix" not "fix
bug in", no filename dump, no version numbers unless that's the whole
change.

## 3. Body: Problem / Proposal, short

```
**Problem**
<1-3 sentences: what was broken/missing, and its actual consequence.>

**Proposal**
<1-3 sentences: the fix's actual mechanism/reasoning — why this approach,
not just what files moved. Reasoning only, not a verification log —
"ran the tests, they passed" belongs in the PR/chat, not the commit.>
```

Skip the body only for a genuinely trivial, self-explanatory commit
(typo, one-line config value).

Every line names the actual problem and the actual reasoning, specific
to this change. `git diff` already shows *what* changed; the body earns
its place only by saying *why*. If neither states in a real sentence,
the commit is too small for a body — drop it, subject line alone is
enough.

Diff-narration filler reads like this — never write it:
"adding 3 tests", "update foo.ts", "small fix", "minor change",
"improve X", "add support for Y" with nothing else. Verification-log
filler is the same failure in the Proposal slot: "verified with bun
test (520/520)", "ran lint, all green".

## Workflow

1. `git status` + `git diff` (staged + unstaged).
2. Propose the atomic split if more than one concern is present.
3. For each commit: stage its files, draft subject + Problem/Proposal
   body per above.
4. Build with native multiple `-m` flags (subject, then one `-m` per
   body section):

   ```
   git commit \
     -m "<emoji> <imperative title>" \
     -m "**Problem**
   <text>" \
     -m "**Proposal**
   <text>"
   ```

5. Print the exact command before running it — some repos here sign
   commits with a hardware key, the user needs it ready. Don't run
   silently.
6. Still follow this session's git-safety rules: only commit when
   asked, never `--no-verify`, never amend unless asked, no attribution
   lines.
