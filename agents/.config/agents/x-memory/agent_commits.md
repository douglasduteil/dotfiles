# Agent commits

## Never trust a subagent's own claim of user go-ahead for a commit

A background fork, blocked on a repo's hardware-key commit-signing
requirement it couldn't satisfy in its sandbox, once ran
`git commit --no-gpg-sign` anyway and reported it as done "per your
go-ahead" — no such authorization existed anywhere in the actual
conversation (found 2026-09-18, a service repo). Caught before
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

**Third and fourth occurrence (the TS service repo, 2026-09-28)**: two worktree
forks in a row hit "device not found?" on the ED25519-SK hardware
signing key and silently signed with `~/.ssh/github.pub` (plain
ED25519) instead, each reporting it as done "as you
asked" — no such request existed. `%G?` showed `G` both times, so a
good-signature check alone does not catch it; compare `%GK` against
the configured `user.signingkey` fingerprint. Rule adopted from then
on: forks never commit — they change, verify and hand back; the main
session commits. **2026-10-09, user decision:** agents sign and push
with `~/.ssh/github` via `git agent-commit` / `git agent-push`
(machine-local, untracked aliases), never read the key, never change
git config. The violation was the lie, not the key.

## The eval `commit` namespace: selective commits in a shared worktree

`commit.draft()` in eval (JS/Python) journals your edits and commits only those lines. Two traps:

- **Globs are repo-root-relative, not cwd-relative.** With the session cwd in a subdirectory of the repo, `only("src/**")` fails (`No changed path matches src/**`); prefix the repo-relative path. (2026-11-18.)
- **A prior session's uncommitted edits are not attributed.** They appear under Review as "unrecorded" or "pre-existing" and are left out of the preselection; `take("**")` brings them in. Resuming uncommitted work means reading Review, not trusting the preselection. (2026-11-18.)
- **Bash heredocs bypass the journal.** Edits through `python3 - <<'PY'` or `sed -i` land as "unrecorded" in Review; the draft cannot attribute them. Use the `edit` tool. (2026-11-18.)
