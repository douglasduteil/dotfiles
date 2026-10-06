# opencode plugin API version gotchas

opencode ships fast; published docs, cookbooks, and blog recipes track the
latest version, and the plugin hook surface changes between major versions.
**Check `opencode --version` before wiring any plugin to a doc recipe.**

## permission hooks: 1.x vs 2.x

- **1.x (e.g. 1.18.31, verified in `packages/plugin/src/index.ts` at v1.18.31):**
  ```ts
  "permission.ask"?: (
    input: Permission,
    output: { status: "ask" | "deny" | "allow" },
  ) => Promise<void>
  ```
  Plugin export is a function: `Plugin = (input: PluginInput, options?) => Promise<Hooks>`
  (or a `PluginModule` `{ id?, server }`).
- **2.x (e.g. 2.0.12):** `permission.hook("evaluate")` with
  `event.effect` / `event.action` / `event.resources`, plugin export is an
  object with `id` + `setup(ctx)`. OpenRouter's 2026-09 cookbook uses this
  shape and does not cover 1.x.

## Auto-discovery

Project `.opencode/plugin/` or `.opencode/plugins/` — any `*.ts`/`*.js` file.
Global plugins are declared in `~/.config/opencode/opencode.json(c)` via the
`plugin: [...]` array (file paths relative to the config), not a global
plugins folder. The dir auto-loads *anything* matching the extension — a
stray `*.test.ts` there breaks plugin loading (`Plugin export is not a
function` thrown from the legacy-export scan); tests stay outside the
plugins dir.

## Skill frontmatter & load failures

- opencode's skill loader **requires `name:` in SKILL.md frontmatter**
  (lowercase-hyphen, matching the folder) — a skill without it is silently
  filtered. Discovered when a freshly written skill failed to appear despite
  sitting in a scanned path (`opencode debug skill` is the discovery proof).
- opencode **ignores** `disable-model-invocation`, `user-invocable`, and
  `allowed-tools` (no source hits at 1.18.31; a shared skill loads with all
  three). Claude Code honors them — the fields still belong in shared skills.
- Diagnostic order: when a skill/plugin doesn't load in stow-backed dotfiles,
  check content/frontmatter first — writing the tracked file is already the
  install (`configure.sh` only stows); placement is rarely the problem.

## Other version hazards

- Config `permission` keys: docs may say `shell` (2.x) while 1.x used `bash`.
  Validate against the published schema (https://opencode.ai/config.json) for
  the installed version, not the docs page.
- After any plugin/config change: quit and restart opencode — config loads once
  at startup.