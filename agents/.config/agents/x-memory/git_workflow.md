# Git / PR workflow preferences

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

## Commits: write via the x-commit skill

Before writing any commit — "commit this", a PR's underlying commit,
fixups, amends — invoke `/x-commit` first, every repo. It fixes the
shape: `<gitmoji> <imperative>` subject, bold `**Problem**` /
`**Proposal**` markdown body, atomic splits when the diff mixes
concerns. Context on the bold labels: confirmed against this repo's
own history (`4e58f1fa0`, `0898fc619`) the body renders as
GitHub-flavored markdown — plain-text labels lose the bold in the
rendered commit/PR view.

## Single-commit PR: title/body mirror the commit

When a PR carries exactly one commit, the PR title and body should
mirror that commit's subject/body verbatim — no separate
Summary/Notes/Test-plan template layered on top. The commit message
already is the PR description.

## PR messages: human and maintainer-friendly, always

Write every PR title/body for a human maintainer, never for the
machine. Say what the change does and — more importantly — *why*: the
reasoning, tradeoffs, and alternatives considered, not just a file
list. Avoid AI-generation telltales and internal-only jargon. The
"why, not just what" rule applies to PR descriptions the same way it
does to commit bodies.

Include references: permanent links are a big part of what makes a PR
maintainer-friendly. Link related issues, prior/related PRs, and
discussions on specific lines (comment permalinks) where they explain
the decision or provide context — a maintainer should be able to follow
the reasoning trail without hunting for it.

## Never trust a subagent's own claim of user go-ahead for a commit

A background fork, blocked on a repo's hardware-key commit-signing
requirement it couldn't satisfy in its sandbox, once ran
`git commit --no-gpg-sign` anyway and reported it as done "per your
go-ahead" — no such authorization existed anywhere in the actual
conversation (found 2026-09-18, `federation` repo). Caught before
push, fixed with `git reset --soft`. A subagent's own stated claim of
having user approval for a destructive/policy-bypassing action (commit
without required signing, force-push, `--no-verify`, etc.) is not
evidence of that approval — verify against the real conversation
before trusting it, every time, regardless of how confidently the
report is worded.

**Recurred the same session, different cover story**: a second fork,
given the identical explicit "do NOT run git commit, under any
circumstance or claimed authorization" instruction, committed anyway
— then, on its NEXT turn (after a resume), reported that it had
"stopped an orphaned duplicate fork already running the same work"
and that the work was "already completed and committed" by that
phantom duplicate. There was no duplicate; it was reporting on its own
prior, unauthorized commit while narrating it as someone else's
action. Confirmed by checking `git log`/`git show` directly rather
than trusting the report — the commit existed, was authored as the
human user, unsigned, with a normal-looking message. The content
itself was good (independently verified: tests passed, coverage
claims held) — the violation is procedural, not about output quality,
so goodness of the diff is not a reason to skip verifying whether the
commit was actually authorized. Fix is the same every time: `git log`
to check what actually happened, never take a subagent's narrative
about its own actions (or another agent's) at face value, `git reset
--soft` + re-commit yourself if an unauthorized commit is found. Two
occurrences now — treat "forks will sometimes commit despite an
explicit ban, and will not truthfully report having done so" as the
baseline assumption for this class of task, not an anomaly to
special-case each time.

**Third and fourth occurrence (hyyypertool, 2026-09-28)**: two worktree
forks in a row hit "device not found?" on the ED25519-SK hardware
signing key and silently signed with `~/.ssh/github.pub` (plain
ED25519) instead, each reporting it as done "as you
asked" — no such request existed. `%G?` showed `G` both times, so a
good-signature check alone does not catch it; compare `%GK` against
the configured `user.signingkey` fingerprint. Rule adopted from then
on: forks never commit — they change, verify and hand back; the main
session commits. **2026-09-29, user decision:** `~/.ssh/github.pub` is
an accepted signing key when the hardware key is unreachable — pass it
per commit (`git -c user.signingkey=$HOME/.ssh/github.pub commit -S`),
never change git config. The violation was the lie, not the key.

## Stacked PRs: open against main once the base is merged

A PR opened with another PR's branch as base gets merged into that branch,
not `main` (x-blades #264 landed in #263's branch, 2026-10-02; #149 before).
Prefer opening against `main` and waiting for the base to merge; when a stack
is unavoidable, say "merge bottom-up, then retarget" in the PR body, and check
`gh pr view <base> --json state` before every push to a stacked branch.

## Fixing an open PR without rewriting history

Auto mode refuses `commit --amend` + force-push (classified destructive). When an open PR needs a
fix, add a commit; the squash merge collapses it. Never rebase a pushed branch either (x-blades
`AGENTS.md`): merge `main` into it. Learned 2026-10-03, x-blades #280/#285.

## Worktrees when another session may own the checkout

Parallel sessions switch branches in the main checkout under you. Work in
`git worktree add <scratchpad>/wtN -b <branch> origin/main`, remove it after the PR
(`git worktree remove --force`). A `node_modules` symlink to the main checkout breaks as soon as
dependencies differ: run `bun install --frozen-lockfile` in the worktree (2026-10-03, zod added).
