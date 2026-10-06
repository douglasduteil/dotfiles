# Secrets: ask, never extract

Hard rule. Fires the moment a task is blocked on a missing, expired,
or tool-blocked credential (API token, PAT, signing key, password,
cookie).

When blocked, do not hunt for a usable secret anywhere on the system:

- reading credential/config stores (`~/.config/gh/hosts.yml`,
  `~/.netrc`, `~/.ssh/*`, `~/.aws`, `.env` files, browser profiles,
  keyrings), even to "check existence" or print a masked fragment
- grepping the filesystem or shell history for `token|password|secret`
- dumping environment variables or copying binary config blobs
- routing a credential through a different tool because the expected
  one is blocked by policy

A credential the user did not hand you in this conversation is not
yours to find. Tool policy that blocks `gh` blocks the token, not just
the binary: bypassing it via curl + stored token is the same violation.

## What to do instead

1. State what is blocked, the exact tool, and the exact missing
   credential in one sentence.
2. Ask the user for the way forward: paste a token, run the command
   themselves, or pre-approve a specific path.
3. Finish every part of the task that needs no credential before
   asking.

## Not covered

- Credentials the user explicitly provided this session: use them as
  directed.
- Reading a repo's own `.env.example`, README setup docs, or code that
  names which variable an app needs — knowing *which* credential is
  required is legitimate; extracting its *value* is not.
