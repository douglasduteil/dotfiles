---
name: x-changeset
description: Write a `.release-it-changeset/<timestamp>-<slug>.md` entry for this repo's `release-it-changeset-plugin` — one gitmoji-prefixed, user-facing line folded into the next release's changelog. Use for "add a changeset", "/x-changeset", or after landing a user-visible fix/feature in a repo with a `.release-it-changeset/` directory. Not for a repo without that directory — plain `x-commit` covers those.
user-invocable: true
argument-hint: <user-facing description of the change>
---

# x-changeset

One line, one claim, grounded in what actually shipped — the user-visible
effect, not the commit message.

1. Check `.release-it-changeset/` exists at the repo root. Missing → this
   repo doesn't use the plugin; say so, stop. Don't create the folder,
   don't fall back to another changelog format.
2. State the claim in one sentence and name the evidence for it (the diff,
   a test that now passes, an upstream changelog entry you read). "Should
   fix a bug" with no evidence behind it is a guess — ask before writing
   an unverified claim.
3. Pick the emoji for the change's category:

   | emoji | for |
   |---|---|
   | ✨ | feature |
   | 🐛 | bug fix |
   | 💄 | UI/style |
   | ⚡ | performance |
   | 🔒 | security |
   | ♿ | accessibility |

4. Write `.release-it-changeset/$(date +%s)-<kebab-slug>.md` (slug: 2-4
   words from the change's topic). Content is exactly one line:
   `<emoji> <description>` — language matches this repo's own past
   entries/`CHANGELOG.md` (French in every repo using this plugin so
   far), present tense, the user-visible effect only. Never filenames,
   function names, or package versions.
5. Leave it unstaged. Committing it is `x-commit`'s job, not this one's.
