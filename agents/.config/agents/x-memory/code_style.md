# Code style preferences

General coding conventions that apply across languages and projects, unless a
project explicitly opts out.

- **Ordering:** keep items in alpha order where possible — keys in objects,
  members in interfaces/types, exports, imports the plugin doesn't already
  touch, function parameters, named arguments, CLI flags, table columns.
  Applies when there is no stronger order (dependency, lifecycle, frequency
  of use). Pragmatic, not dogmatic — don't break alpha order if it makes the
  code harder to read.
- **Function params:** more than two parameters, or any
  optional/defaulted one → one explicit object argument
  (`mairie({ id, mail, name, site, siren })`), never a
  positional list (`mairie(id, siren, site, mail, name = "Coise")`).
  Call sites name every value; keys follow the alpha-order
  rule above. Stated by the user 2026-10-02 on test fixture
  helpers in api-partenaires.
- **Git branches:** prefix new branches `douglasduteil/<name>` (see `cmm`
  alias in `git/.gitconfig`, dotfiles repo).
- **PR/branch shape:** atomic PRs — one branch, one commit, one simple
  vertical change. No bundling unrelated concerns. If follow-up work adds
  commits to an already-pushed branch, squash back to one commit
  (`git reset --soft <merge-base>`, recommit, `push --force-with-lease`)
  before leaving it — don't let a PR accumulate a fix-up history.
- **Comments:** write self-explanatory code — good naming and structure
  over explanation. Default diff carries zero comments. Every comment is
  a hidden maintenance cost (a second source of truth that rots silently
  as code drifts), and only the human decides whether that cost is worth
  paying — so a comment always requires explicit human sign-off before
  landing, same as any other unrequested addition. An urge to explain is
  a signal to fix naming/structure first, not license to comment. The
  one exception (non-obvious why, a constraint, a workaround — nothing
  the code itself can say): propose it caveman-compressed to the
  tersest one-liner, and let the human approve or refuse it.
- **Node/Bun scripts:** run through the package manager's run command
  (`npm run format`, `bun run format`), never the underlying binary
  directly (`npx prettier`) — the script wraps flags/config/plugins a
  raw binary invocation skips.
- **GitHub Actions:** always pin `uses:` to a commit SHA, never a floating
  tag (`@v1`, `@v2`) — a tag can be repointed upstream and silently break
  a working pipeline (seen: `changesets/action@v1` drifted to require a
  CLI major version the repo didn't have). Keep the human-readable tag as
  a trailing `# v1.2.3` comment.
- **Bad config: fail fast at startup, don't degrade.** Invalid/malformed
  configuration should panic/throw during bootstrap, not let the program
  boot in a broken state that then has to be exercised through a live
  request path to prove it fails correctly. Test the failure as a
  boot-time assertion (module/app construction throws/rejects) rather
  than an HTTP-level or runtime-level case reaching some downstream
  symptom of the bad config. Applies when choosing between "validate at
  startup and crash" vs "validate lazily on first use" for config —
  prefer the former.


## Final newline and .editorconfig

Every file gets a trailing newline; the repos carry a root `.editorconfig`
(utf-8, 2-space, `insert_final_newline`) so editors and agents enforce it
from disk. Before pushing agent-written files, check quickly:

    for f in <files>; do [ -n "$(tail -c1 "$f")" ] && echo "NO EOL: $f"; done

Recurred 2026-10-01 (clickr-adventures): three agent-written files landed
without the newline and the convention had nowhere to live.

## Prefer Intl over hand-rolled formatting

Plurals, lists, numbers, dates shown to a user go through `Intl`
(`PluralRules`, `ListFormat`, `NumberFormat`…) rather than `n === 1 ? … : …`
or `join(", ")`. Stated by the owner 2026-10-02 (x-blades game text). Keep
machine formats (an ISO date stamp, a pasted summary pinned by tests) as they
are.
