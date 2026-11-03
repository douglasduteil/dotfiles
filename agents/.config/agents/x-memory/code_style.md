# Code style preferences

General coding conventions that apply across languages and projects, unless a
project explicitly opts out.

- **Type naming:** type, interface and class names are PascalCase without underscores — `ModerationEvent`, not `Entreprise_API_Association_Response`. Stated by the user 2026-10-28.
- **File & function naming:** `snake_case` for `.ts` module files and
  functions/hooks; `PascalCase` only for type/interface/class names and
  `.tsx` components; tests `<module>.test.ts`. Stated 2026-10-30
  (the TS service repo's PascalCase `.ts` modules and handler-factory
  functions were the outlier; snake_case matches the DB vocabulary and
  the snake_case inner functions already in use).
- **Plain functions over query factories:** a read/write takes its
  dependencies as arguments
  (`get_organization_domains(pg, { organization_id })`); do not wrap it
  in a curried `GetX(pg) => get_x(args)` or a `*Factory` second query
  layer. Reserve `*Factory` for genuine construction. Stated 2026-10-30.
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
  helpers in the API repo. Test helpers: any helper taking two
  or more arguments gets one object argument
  (`candidate_row({ domain, id })`); stated 2026-10-15 after
  `candidate_row(domain, id)` slipped through.
- **Git branches:** prefix new branches `douglasduteil/<name>` (see `cmm`
  alias in `git/.gitconfig`, dotfiles repo).
- **PR/branch shape:** atomic PRs — one branch, one commit, one minimal
  vertical slice: the smallest end-to-end behaviour a caller can observe,
  shipped with its own tests, docs and the refactor it needs, together.
  Never segment one feature across PRs by layer: no feature PR without
  its tests, no test-only or example-only PR for a feature landed
  elsewhere, no prep refactor PR whose only reason is an upcoming
  feature. A test or refactor PR stands alone only when it is the change
  itself (fixing a gap in existing behaviour). No bundling unrelated
  concerns either. Stated by the user 2026-10-16 (the API repo's
  resource-server plan, split ♻️/✨/✅ merged back into one slice). If
  follow-up work adds commits to an already-pushed branch, squash back to
  one commit (`git reset --soft <merge-base>`, recommit,
  `push --force-with-lease`) before leaving it — don't let a PR
  accumulate a fix-up history.
  Split a slice into the smallest PRs that each have one clear vertical
  goal, and every PR uses everything it adds: no column, export, field or
  branch without a caller in the same diff (user, 2026-10-29,
  proconnect-identite activity-logs: "go even smaller", "try using what we
  add").
- **Function names say what they return:** `getMemberIdsPromotedByDomain`,
  not `decideDomainVerification` ("opaque", user, 2026-10-29). An outcome
  `kind` names what was checked: `organization_not_found` when the
  organization is missing.
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
  Bare `//` separator lines are the exception to "zero comments": they
  stay, the user uses them for spatial awareness (2026-10-30). Strip
  only prose comments that no longer describe the code.
- **Node/Bun scripts:** run through the package manager's run command
  (`npm run format`, `bun run format`), never the underlying binary
  directly (`npx prettier`) — the script wraps flags/config/plugins a
  raw binary invocation skips.
- **Shell scripts:** follow [functional shell rules](https://www.functionalprogramminginbash.com/)
  when the script's job fits (pure functions, no side effects, data via
  stdin/stdout, composition over mutation). Pragmatic, not dogmatic.
- **Throwaway scripts** (file splits, link checks): write them in `bun`.
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

Recurred 2026-10-01 (a game prototype repo): three agent-written files landed
without the newline and the convention had nowhere to live.

## Prefer Intl over hand-rolled formatting

Plurals, lists, numbers, dates shown to a user go through `Intl`
(`PluralRules`, `ListFormat`, `NumberFormat`…) rather than `n === 1 ? … : …`
or `join(", ")`. Stated by the owner 2026-10-02 (game UI text). Keep
machine formats (an ISO date stamp, a pasted summary pinned by tests) as they
are.
