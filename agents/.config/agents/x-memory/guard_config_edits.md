# Editing guard configs (the tmp-script procedure)

The x-guard denies agents touching guard configs through every door: the
`edit`/`write` tools (hook refuses), and any bash command whose text
contains a guarded path — including read-only ones like
`git diff agents/.config/omp/agent/config.yml`. Verified 2026-10-27
(dotfiles: omp `config.yml`, `claude/settings.json`, `opencode.jsonc`,
Constitution, x-guard itself). Never engineer around it: no `git add -A`,
no pathspec tricks, no other tool reaching the same file (Constitution
III(1)); a user's verbal approval does not disable the mechanical guard —
stop and hand the change to the user.

## The procedure that works

1. Draft the exact diff first (read the file with the `read`/`grep` tools —
   tool-based reads are not bash-pattern-gated).
2. Write an idempotent script to `/tmp` for the user to run in their own
   terminal. Required shape, in order:
   - idempotence check (`grep -q` for the new content → "already applied")
   - anchor-line sanity check (the exact line to edit must match, else
     abort with "file changed; apply by hand")
   - the `sed -i` insertion/replacement
   - print `git diff` of the tracked file for review
3. Verify afterward with non-bash tools: `read`/`grep` on the repo path,
   plus the tool's own query surface where one exists (`omp config get
   <key>`, `opencode debug config`).
4. Session-runtime gotchas seen with this flow: the tracked file is often
   stow-symlinked, so editing the repo copy is the live config (no restow);
   and a persistent daemon may serve stale config (opencode's
   `serve --service`) — see `opencode_plugins.md`.

The blocked-call report is still owed to the user every time (exact tool +
path + guard reason) — the script supplements the report, it does not
replace it.

## Handing over commits that contain a guarded path (2026-11-27)

The guard also denies `git add`/`git diff` whose command text names a guarded
path, so a dirty guarded file cannot be committed by the agent at all. When
the user says "commit" and the tree holds one, answer in this exact shape —
same fields, same order, every time:

1. **What landed.** Commits the agent did make, with subject and signature
   state.
2. **What is blocked.** The verbatim blocked calls and their guard reasons,
   not a paraphrase, including any read-only call the guard refused this
   turn. Near-misses and completed bypasses get their own paragraph, worded
   as bypasses.
3. **The handover commands.** Per concern, never one lump: a single guarded
   file that mixes concerns is split with `git add -p <path>` — name which
   hunks get `y` and which `n` (e.g. "y on the role hunk, n on the rest") —
   then `git agent-commit -m … -m …` with the full subject and
   Problem/Proposal body written out ready to paste. Signing is the alias's
   job; do not add `-S` or `--no-gpg-sign`.
4. **What the agent could not see.** Any guarded file whose diff was never
   read (so no body can be drafted), stated as a request: paste the diff, or
   lift the guard for the session.
5. **Self-initiated commits.** Anything committed from the agent's own open
   question (a `.gitignore` rule, a cleanup) is labelled as such, with
   `git reset --soft HEAD~1` offered. Never let it read as part of the user's
   instruction; answering your own unanswered question is scope drift.

