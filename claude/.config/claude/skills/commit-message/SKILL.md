---
name: commit-message
description: Format a git commit message by deriving this repo's actual conventions from its CONTRIBUTING.md and commit history, rather than a generic style. Use whenever drafting or writing a commit message, or when the user asks to "write a commit", "commit this", or review a commit message's format — in any repo, not just one project.
user-invocable: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# Commit message conventions

This skill is global — it loads in whatever repo you're in. It has no
built-in house style; every repo writes commits differently. Derive the
convention from *this* repo each time, don't assume gitmoji or any other
scheme carries over from elsewhere.

## Step 0: derive this repo's convention

1. Look for a contributing guide (`CONTRIBUTING.md`, `.github/CONTRIBUTING.md`,
   or commit-message rules in `README.md`) and follow it as source of truth.
2. Cross-check against real history: `git log --no-merges -20 --format='%s'`
   for subject-line shape (prefix style, emoji or none, scope conventions,
   case, punctuation), and `git log --no-merges -5 -p` for whether bodies
   are used and how they're structured.
3. Check for a linted convention (`commitlint.config.*`, `.commitlintrc*`,
   a `commit-msg` hook) — if present, it's binding, not just a pattern to
   imitate.
4. If history is sparse or inconsistent, default to: present-tense,
   imperative, no trailing period, no emoji, a body only when the change
   isn't self-explanatory from the diff — and say you're using this
   fallback rather than presenting it as a discovered convention.

Don't reuse a convention from a *different* project (including gitmoji,
Problem/Proposal bodies, or any other scheme you've used elsewhere) unless
this repo's own CONTRIBUTING.md or history actually shows it.

## Scope of a commit

- One logical change per commit. Don't mix unrelated files.
- If a diff touches more than one concern, say so and propose splitting it
  rather than writing one commit that covers everything.

## Subject line

Shape it per what Step 0 found. Regardless of the repo's specific scheme:

- Short, present tense, stands alone without the body (it becomes the
  changelog line and, for single-commit PRs, often the PR title).
- Don't add a PR number by hand — hosts like GitHub append it on merge.
- If the repo uses gitmoji, pick the emoji from what that repo's own
  history actually uses, most → least common — don't guess from
  gitmoji.dev's full list.

## Body

Skip it only for genuinely trivial, self-explanatory changes. When a repo's
convention calls for a structured body (e.g. Problem/Proposal, or
conventional-commit footers), match that structure exactly — see example
below for what a Problem/Proposal-style repo looks like. Otherwise:

- Prose wrapped to ~72–80 columns, or bullets if the repo's history favors
  bullets.
- Explain *why*, not a restatement of the diff — that's what `git diff`
  is for.
- If the repo's CONTRIBUTING.md says design discussion belongs in the
  commit body (not only chat/Slack/PR comments), follow that.

## Example of a derived, repo-specific convention

This is what Step 0 previously found for one particular repo
(gitmoji subject + Problem/Proposal body) — illustrative of the *method*,
not a default to apply elsewhere:

```
✨ personal-information: allow disconnecting FranceConnect identity

**Problem**
A user whose FranceConnect data is stale or wrong has no way to
unlink it — given_name/family_name stay locked to FranceConnect-sourced
options forever.

**Proposal**
Add a "Se déconnecter de FranceConnect" action on /personal-information
that deletes the franceconnect_userinfo row for the user. Every
FranceConnect-aware check (identity guards, name-option lookups) reads
that table live per-request, so the delete alone restores free-text
editable fields everywhere. Covered by a new cypress e2e spec.
```

## Workflow when invoked

1. Do Step 0 above to establish this repo's actual convention.
2. Run `git status` and `git diff` (staged + unstaged) to see what would
   be committed.
3. Draft the subject + body per the convention derived in Step 0.
4. Commit with native multiple `-m` flags, one per paragraph, instead of
   a heredoc — git already blank-line-separates each `-m` into its own
   paragraph, so this maps directly onto subject / body-section /
   body-section with no manual blank-line wrangling:

   ```
   git commit \
     -m "<subject line>" \
     -m "<first body paragraph or section>" \
     -m "<second body paragraph or section, if any>"
   ```

   Still follow this session's other git-commit protocol (staging
   specific files, any required trailer as its own trailing `-m`) and
   safety rules (never `--no-verify`, never amend unless asked, only
   commit when the user asked to) — this skill only changes the
   *content* and *invocation form* of the message, not those rules.
