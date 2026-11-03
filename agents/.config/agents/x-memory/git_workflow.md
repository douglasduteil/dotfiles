# Git / PR workflow preferences

## Worktrees: `wt` (worktrunk)

Worktree operations go through `wt` (worktrunk 0.80.0; installed from nixpkgs
in the dotfiles profile, 2026-10-27), not raw `git worktree`:
`wt switch --create <branch> --base origin/main` to create, `wt list`,
`wt remove <branch>` after the merge, `wt merge main` (squash, rebase,
fast-forward, clean up; skip it where PRs merge on GitHub). Full
agent-facing reference: the official `worktrunk` Claude Code plugin
(installed from the flake-pinned upstream repo, MIT/Apache-2.0), whose
skills include `worktrunk` and `wt-switch-create`. Docs: https://worktrunk.dev.

- **Native naming** (user, 2026-10-27): let `wt` choose the path. With no
  config the template is `{{ repo_path }}/../{{ repo }}.{{ branch | sanitize }}`,
  a sibling directory such as `../<repo>.<github-user>-fix-x`.
  Never pass a custom path (`/tmp/…`, `wtN`); `wt list` marks a worktree
  outside its implied path with `⚑`.
- Shell integration (`wt config shell install`, auto-cd) was NOT installed
  as of 2026-10-27: `wt switch` never changes an agent's cwd. Use `--no-cd`,
  read the path from `wt list`, pass `cwd` / `-C <path>`.
- Cleanup: `wt list --full` shows `⊂` (integrated) and `⊟` (directory gone).
  `git worktree prune` drops `⊟` entries; `wt remove <branch>` removes a
  clean `⊂` worktree and its branch; a squash-merged branch it can't detect
  needs `-D` after checking the PR is merged. Leave dirty worktrees (`+ ! ?
  ✘`) to the user.

## Branch naming: `<github-username>/<kebab-slug>`

Enforced live via the `x-conventions` skill (one router skill covering
every wiki topic, auto-triggers on branch creation among others) —
this page is the reasoning/history record, not the active mechanism.
A plain AGENTS.md bullet was tried first and failed: tested
empirically against both deepseek-v4-flash and Claude Sonnet 5
headless, both quoted the rule correctly on direct ask but ignored it
during actual branch-creation tasks. Packaging it as a step-shaped
skill instead — evaluated by the harness as an explicit per-turn
relevance decision, not passive prose — fixed it reliably on Sonnet 5
(3/3 trials, originally under a dedicated `x-git-branch` skill later
folded into `x-conventions`). Full trace:
`.agents/x-research/1-model-capability-vs-framing.md` and
`2-generalize-to-whole-wiki.md` in the dotfiles repo.

Personal convention, confirmed 2026-09-14 by scanning `git log --all`
branch names across repos (e.g. `douglasduteil/add-quorum-queue-type`).
No `type/` prefix (`fix/`, `feat/`) — flat kebab-case slug under the
username namespace. Before naming a branch, check for this pattern:

    git log --all --format='%D' | grep -oE 'origin/[a-zA-Z0-9._/-]+' | grep -v 'origin/main$' | sort -u

If the repo's own history uses a different convention, follow that
repo's instead — this is the default, not an override.

## New branch: never track `main`

Branch off `origin/main` with `--no-track`:
`git switch -c <branch> --no-track origin/main` (worktree:
`wt switch --create <branch> --base origin/main`, which sets no upstream
when the names differ). Without it,
git sets the new branch's upstream to `origin/main`, so a bare `git push`
or `git pull` targets `main`. First push sets the real upstream:
`git push -u origin <branch>`. Already tracking `main`? Run
`git branch --unset-upstream`. Stated by the user 2026-10-08
(the release pipeline repo, `git switch -c … origin/main` left the branch on
`origin/main`).

## Commits: write via the x-commit skill

Before writing any commit — "commit this", a PR's underlying commit,
fixups, amends — invoke `/x-commit` first, every repo. It fixes the
shape: `<gitmoji> <imperative>` subject, bold `**Problem**` /
`**Proposal**` body written for a colleague — plain full sentences,
one or two short sentences per section, not caveman — and atomic splits
when the diff mixes concerns. The body carries the why; the diff carries
the what. GitHub renders commit and PR bodies as Markdown, so the bold
labels survive the render; plain-text labels lose the bold in the
commit/PR view.

## Single-commit PR: title/body mirror the commit

When a PR carries exactly one commit, the PR title and body should
mirror that commit's subject/body verbatim — no separate
Summary/Notes/Test-plan template layered on top. The commit message
already is the PR description.

## PR messages: human and maintainer-friendly, always

Write every PR title/body for a human maintainer, never for the
machine. Say what the change does and — more importantly — *why*: the
reasoning, tradeoffs, and alternatives considered, not just a file
list. Avoid AI-generation telltales and internal-only jargon. Same voice
as the x-commit body: full sentences, calm and factual, short (user,
2026-11-02: terse fragment bodies read as harsh to colleagues). The
"why, not just what" rule applies to PR descriptions the same way it
does to commit bodies.

Neither the PR body nor the commit body carries verification lines:
no "Checked locally: …", no test counts, no "tests pass" (user,
2026-10-29). CI says whether it is green; the human says what they
verified, in chat. Describe the change and its reasoning only — state
behaviour parity as an intent ("no moderator-visible behaviour
change"), not as a test log.

Never mention the planning docs in a commit or PR: no proposal, slice
ids (S1, S2…), tasks.md or handoff, not even "the proposal's S2"
(user, 2026-10-29). Say what the code does now and, when a
limit matters, what would lift it, in the codebase's own terms.

Include references: permanent links are a big part of what makes a PR
maintainer-friendly. Link related issues, prior/related PRs, and
discussions on specific lines (comment permalinks) where they explain
the decision or provide context — a maintainer should be able to follow
the reasoning trail without hunting for it.

Subagent commit claims, signing rules and how to verify what actually happened:
[agent commits](agent_commits.md).

## Stacked PRs: open against main once the base is merged

A PR opened with another PR's branch as base gets merged into that branch,
not `main` (a game-repo PR landed in its stack's base branch, 2026-10-02; one before).
Prefer opening against `main` and waiting for the base to merge; when a stack
is unavoidable, say "merge bottom-up, then retarget" in the PR body, and check
`gh pr view <base> --json state` before every push to a stacked branch.

## One PR, one commit

Keep each PR at one commit. A follow-up fix on a pushed branch is squashed
into that commit (`git reset --soft <merge-base>`, recommit) and pushed with
`--force-with-lease`; do not stack fix-up commits whose only purpose is to
patch the same change. Squash merges hide them, but the PR history should
read as one change. Stated 2026-11-02. Run the squash in the main session: the
commit skill stages and commits, it does not rewrite history. Force-push is
always `--force-with-lease`, never bare `--force`. Rebasing onto `main`
stays out; merge `main` into the branch when it must catch up.

## Worktrees when another session may own the checkout

Parallel sessions switch branches in the main checkout under you. Work in a
`wt` worktree at its native path (`wt switch --create <branch> --base origin/main --no-cd`),
remove it after the PR (`wt remove <branch>`). A `node_modules` symlink to the main checkout breaks as soon as
dependencies differ: install in the worktree (`bun install --frozen-lockfile`
/ `npm ci`) (2026-10-03, zod added).
