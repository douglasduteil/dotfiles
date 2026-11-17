---
name: x-dep-fix
description: Pick a Dependabot/Renovate PR whose CI fails, gate it against supply-chain tampering, then make the smallest fix that turns CI green.
disable-model-invocation: true
---

# x-dep-fix

Current git repo, npm only. Every **stop** ends the run with a short report: what tripped, the evidence, what you would need from the user. A stop is a finished run, never a problem to route around; only the user clears it.

## 1. Pick the PR

```sh
for bot in app/dependabot app/renovate; do
  gh pr list --state open --author "$bot" --limit 50 \
    --json number,title,author,headRefName,baseRefName,statusCheckRollup \
    --jq '.[] | select(any(.statusCheckRollup[]; .conclusion == "FAILURE")) | {number, title, author: .author.login, head: .headRefName, base: .baseRefName, failing: [.statusCheckRollup[] | select(.conclusion == "FAILURE") | {check: .name, workflow: .workflowName}]}'
done
```

Offer the results as a single-choice question: `#number title (failing checks)`. None → report "no failing bot PR", stop. Keep each failing check's `workflow`: steps 2 and 5 need it.

## 2. Pre-flight

All on the chosen PR, before any checkout:

- **Commit authors**: `gh pr view <n> --json commits --jq '[.commits[].authors[].login] | unique'` lists only the bot that opened the PR. A human or other account → stop.
- **Lockfile**: the head tree holds `package-lock.json` and none of `bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock` (`gh pr view <n> --json files --jq '.files[].path'` plus `git ls-tree`). Anything else → stop, naming the lockfile.
- **Base health**: for each failing check, the latest run of its workflow on the base branch (`gh run list --branch <base> --workflow "<workflow>" --limit 1 --json conclusion`, `<workflow>` from step 1, never the check name) is green. Red on base too → stop: the bump did not cause it.

## 3. Worktree

```sh
git fetch origin <base> <head>
wt switch <head> --no-cd
```

Read the path from `wt list`; run everything below with that path as cwd.

## 4. Gate

```sh
bun ~/.config/agents/skills/x-dep-fix/scripts/lock_audit.ts origin/<base> HEAD
```

Exit 0 with no output: gate passed. Exit 1: one JSON line per flag → stop, quote every line. Exit 2 (`audit_failed`) → stop.

| flag | meaning |
| --- | --- |
| `file_outside_manifests` | PR touches a file other than `package.json` / root `package-lock.json` (workflows, `.npmrc`, sources) |
| `manifest_non_dependency_change` | a `package.json` changed outside dependency fields (`scripts`, `bin`, …), or was added/removed |
| `foreign_source` | `resolved` outside `registry.npmjs.org`: git, tarball, http |
| `install_script_added` | a package gains `hasInstallScript` it never had in base |
| `integrity_changed` | same name@version, different integrity: republished or swapped tarball |
| `unexplained_package` | new package no changed entry depends on |
| `fresh_release` | version published < 7 days ago |
| `publish_time_unknown` | registry gave no publish time: unverifiable |

Then:

```sh
npm ci --ignore-scripts
npm audit signatures
```

Any signature or attestation failure → stop.

## 5. Read the failure

Per failing check: `gh pr checks <n>` → run id; `gh run view <run-id> --log-failed`, trimmed to the error lines (compiler errors, failing test names, assertion diffs). Read the full log only when the trimmed one leaves the cause open. Find the failing step's `run:` line in the workflow from step 1 under `.github/workflows/`. The step needs a service container, `secrets.*`, or env you lack → stop.

State the cause in one sentence, tied to the bumped package's changelog or release notes when the cause is an API change.

## 6. Smallest fix

Run the step's command locally; it goes **red** on the same error before you change anything. Then make the **smallest fix** on the repo's side: adapt the calling code, types, config, or test to the new version.

The bump stays exactly as the bot wrote it: same versions, same lockfile, no pins, no downgrades, no extra upgrades. A lockfile change is in scope only when the fix itself is a required peer dependency the new version demands; rerun the gate (step 4) after it.

Bounds, any one → stop with a plan instead of a fix:

- the fix exceeds ~30 changed lines, or needs a migration across many call sites;
- the local failure comes from a package whose install script was skipped. Ask the user to approve that package by name; approved and its `hasInstallScript` already present in base → `npm rebuild <pkg>`, rerun. Otherwise stop.

Done when the step's command passes locally and `git diff --stat` shows only the fix.

## 7. Commit and hand back

Commit through `/x-commit` on the PR branch. Show the user the diff, the cause sentence, and the gate result. Ask before `git push`: once a human pushes, Dependabot stops rebasing the PR (`@dependabot recreate` discards the fix). Leave the worktree for the user; `wt remove <head>` after merge.
