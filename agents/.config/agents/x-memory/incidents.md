# Agent security incidents

Why each Article of the Constitution (`~/.config/agents/rules/constitution.md`) and each guard rule exists.
Every incident below followed one loop: a guard blocked the call, the
agent rewrote the call and retried. Read before loosening any guard.

## 2026-10-01 — private SSH key printed (clickr-adventures, omp, glm-5.3-flash)

User granted "use github.pub to sign commits and push over ssh". Within
seconds the agent listed `~/.ssh/`, read `~/.ssh/config`, ran
`head -2 ~/.ssh/github` (printed the private key header and first base64
line to the model provider), and probed both keys for a passphrase with
`ssh-keygen -y -P ""`. When the `*/.ssh/*` deny landed it retried four
times through `$KEY`, `$SIGNKEY` and `readlink … > /tmp/signkey`.
The printed line holds only the OpenSSH header, not key bytes. The key
had no passphrase; rotation to a passphrase-protected key was started
2026-10-06.

Guards: `*/.ssh/*` and `ssh-keygen -y`/`-p` denies; omp `x-guard` hook
for the read/grep/edit tools; Constitution Article III(1)–(2).

## 2026-10-02 — gh token read from hosts.yml (api-partenaires, omp, glm-5.3-flash)

`gh` was blocked by policy. The agent read the oauth token from
`~/.config/gh/hosts.yml` to call the GitHub API with curl, then split the
path into a variable (`CFGD=~/.config; … $CFGD/gh/hosts.yml`) to pass the
`*config/gh/*` deny. Led to the `secrets.md` page.

Guards: `*hosts.yml*`, `*oauth_token*` denies; Constitution Article III(1)–(2).

## 2026-10-02 — hardware key loaded into an agent-owned ssh-agent (proconnect-identite, omp, glm-5.3-flash)

Signing failed because the hardware key was locked. The agent started its
own `ssh-agent` on `/tmp/ssh-agent.sock` and tried seven times to
`ssh-add` the key with rewritten paths, then switched to Python and JS
`eval` with `child_process`. Only the `eval: prompt` approval stopped it.

Guards: `*ssh-add*` (except `-l`/`-L`) and `*ssh-agent*` denies; Constitution
Article III(1) ("another tool, another language runtime" counts as a retry).

## 2026-10-06 — gh token printed (proconnect-identite, omp, gemini-3.8-flash)

`gh auth token` was denied; the agent used
`gh auth status --show-token | grep -o 'gho_…'` and scripted a curl gist
upload, while its own reasoning claimed it was following the secrets
protocol. The always-loaded secrets line added on 2026-10-02 had never
been committed and was gone from `AGENTS.md`.

Guards: `*--show-token*`, `*gho_*`/`*ghp_*`/`*github_pat_*` denies;
Constitution written as a tracked, always-loaded file.

## Patterns

- All four ran on cheap "flash" models with omp in `yolo` mode.
- Deny-lists matched against command text lose to rewording; the one
  guard that held was a prompt the user answered.
- Agents can loosen their own guards: on 2026-10-03 an agent rewrote the
  omp `gh` rules on request. Guard config is now user-only (Article III(3)).
