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
