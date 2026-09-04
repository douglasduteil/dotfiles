---
name: commit-message
description: Format a git commit message following this repo's CONTRIBUTING.md and actual commit history conventions (Gitmoji subject with optional scope, Problem/Proposal body). Use whenever drafting or writing a commit message for proconnect-identite, or when the user asks to "write a commit", "commit this", or review a commit message's format.
user-invocable: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git add:*)
  - Bash(git commit:*)
---

# Commit message conventions — proconnect-identite

Source of truth: `CONTRIBUTING.md`, cross-checked against real history
(`git log --no-verify -p`). Follow this instead of a generic commit style.

## Scope of a commit

- One micro-commit per logical change. Don't mix unrelated files.
- If a diff touches more than one concern, say so and propose splitting it
  rather than writing one commit that covers everything.

## Subject line

`<gitmoji> [<scope>: ]<short description>`

- **Gitmoji**: one emoji from https://gitmoji.dev matching the change type.
  Pick from what this repo actually uses, most → least common:
  `♻️` refactor, `✨` feature, `🔖` release/version bump (automated, don't
  use by hand), `💬` copy/wording fix, `💄` UI/style tweak, `🐛` bug fix,
  `🗑️` remove code, `🔧` config, `📝` docs, `⬆️`/`⬇️` dependency bump,
  `⚡️` perf, `🔒` security, `✏️` typo, `⏪️` revert.
- **Scope** (optional, no brackets, lowercase, followed by `: `): either a
  conventional-commit-style keyword (`fix:`, `feat:`, `refactor:`, `perf:`,
  `security:`, `chore(deps):`) or a domain/directory name that matches
  where the change lives (`identite:`, `personal-information:`). Both
  styles coexist in history — pick whichever names the change better;
  it's fine to omit the scope entirely for a small, obvious change.
- **Description**: short, present tense, no trailing period. It becomes
  the changelog line and (for single-commit PRs) the PR title, so it must
  stand alone without the body.
- Do not add a PR number by hand — GitHub appends `(#123)` on merge.

## Body

Skip the body only for genuinely trivial, self-explanatory changes
(typo fixes, a one-line copy tweak). Otherwise structure it as:

```
**Problem**

What was wrong or missing, and why it mattered. State the user-visible
or code-level symptom, not just "X was refactored".

**Proposal**

What this commit does about it, and any rationale for the approach taken
over alternatives. Mention follow-up work left out of scope if relevant.
```

- Prose, wrapped to ~72–80 columns, no bullet-only bodies unless the
  content is genuinely a list.
- Explain *why*, not a restatement of the diff — that's what `git diff`
  is for.
- Never put PR discussion only in chat/Slack/Tchap — put it in the
  commit body per CONTRIBUTING.md.

## Example (matches real history)

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

1. Run `git status` and `git diff` (staged + unstaged) to see what would
   be committed; run `git log --no-merges -5` if unsure how a similar
   past change was described.
2. Draft the subject + body per the rules above.
3. Commit with native multiple `-m` flags, one per paragraph, instead of
   a heredoc — git already blank-line-separates each `-m` into its own
   paragraph, so this maps directly onto the subject / **Problem** /
   **Proposal** structure with no manual blank-line wrangling:

   ```
   git commit \
     -m "🐛 personal-information: fix inconsistent date/time timezone display" \
     -m "**Problem**
   The FranceConnect last-update date was formatted with \`timeZone: \"UTC\"\`
   while the time right below it used the server's local timezone. Near
   midnight this could show a date that didn't match the displayed time." \
     -m "**Proposal**
   Drop the UTC override so the date and time render in the same (local)
   timezone, consistent with each other."
   ```

   Still follow this session's other git-commit protocol (staging
   specific files, any required trailer as its own trailing `-m`) and
   safety rules (never `--no-verify`, never amend unless asked, only
   commit when the user asked to) — this skill only changes the
   *content* and *invocation form* of the message, not those rules.
