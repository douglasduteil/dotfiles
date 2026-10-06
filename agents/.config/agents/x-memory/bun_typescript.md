# Bun + TypeScript project preferences

Apply to any new or existing Bun + TypeScript project unless the project already opts out.

- **Naming:** `snake_case` everywhere identifiers are chosen — file and directory names (e.g. `query_action.ts`, `src/hooks/`), and variable/function names (e.g. `extract_d`, `dsfr_version`, not `extractD`/`dsfrVersion`). Types/interfaces/classes keep PascalCase.
- **TypeScript:** latest stable. Extend `@tsconfig/bun` from `devDependencies`.
- **Prettier:** default config, declared in `package.json` (not `.prettierrc`). Include `prettier-plugin-organize-imports` so imports stay grouped and deduped.
- **Tests:** `*.test.ts` next to the source file it covers, run via `bun test`.
- **Module resolution:** prefer `package.json#imports` and `package.json#exports` over `../../` traversal. Add an `imports` map when a deep path would otherwise need `../../../`.
- **Shell scripts:** respect [functional shell rules](https://www.functionalprogramminginbash.com/) when the script's job fits (pure functions, no side effects, data via stdin/stdout, composition over mutation). Pragmatic, not dogmatic.

## Bun runtime API gotchas (found via hands-on testing)

- `Bun.serve()`'s `{dir: ...}` static-route shorthand throws ("Failed to resolve react-server-dom-bun/server") when an ancestor `package.json` has react/next as a dependency — it triggers Bun's fullstack-framework auto-detection. Workaround: serve manually via `Bun.file()` in a wildcard route handler, and re-add path-traversal guarding yourself (the shorthand's for-free protection is lost).
- `Bun.WebView`: `click()`/`type()` resolve once the action is dispatched, NOT once a triggered navigation completes. Poll `view.url` (or similar) before the next DOM interaction, or intermittent failures/hangs follow. Undocumented as of Bun 1.3.
- `Bun.WebView` headless smoke check / screenshot (verified Bun 1.4.2, 2026-10-01): serve the page
  (`bun --port=3917 page.html` in the background), then `const view = new Bun.WebView({ width, height })`,
  `await view.navigate(url)`, poll `view.loading` until false, `await view.evaluate("<js string>")`
  for DOM text, `await view.screenshot()` returns PNG bytes for `Bun.write`, `view.close()`. Other
  methods: `click`, `type`, `press`, `scroll`, `resize`, `reload`, `cdp`. Use for rare UI checks,
  not CI.
- `Bun.WebView.type(text)` is single-arg — types into the currently-focused element. It is not `type(selector, text)`; click/focus the target first.
- `Bun.markdown.render()`'s per-node callbacks are all-or-nothing: passing ANY callback drops the default HTML wrapper for every node type you didn't also handle (no partial-override/fallback-to-default). For anything beyond overriding literally every node type, use `.html()` for default rendering and pre/post-process the Markdown source / HTML string instead.

## Sentry local-testing quirks

- Sentry's DSN validator rejects a bare "localhost" hostname (no dot) — 127.0.0.1 works.
- DSN public-key segment rejects hyphens (real Sentry keys are hex, so this only bites test fixtures).
- `Sentry.init()` does NOT throw on an invalid DSN — it logs a warning and silently no-ops. `captureException()`/`flush()` then look like they did nothing, not like the DSN was bad.

## Bun dev server: imports in a cycle are `null` at load

`bun <file>.html` (dev server, HMR) wraps each module; inside an import
cycle the imported binding is still `null` while the module body runs. The
production bundle (`bun build`) hoists and works, so a build-only smoke test
misses it. Never read an imported function at module load
(`el.onclick = show_menu`); wrap it (`el.onclick = () => show_menu()`).
Hit in x-blades game screens, 2026-10-02 (`TypeError: … import_menu3 is null`).

## Throwaway scripts

Write one-off scripts (file splits, link checks) in `bun`: no `python3` on this NixOS host (2026-10-02).

## Bun / tooling gotchas (2026-10-03, x-blades)

- Bun 1.4.2 has no `import.meta.glob`: the bundler leaves the call in and it throws at runtime. Use
  a hand-written registry plus a test that lists the folders. `bun test` imports modules that
  import `.css` without trouble.
- oxlint `no-restricted-imports` patterns are `.gitignore` syntax: escape a leading `#`
  (`"\\#assets/**"`), `*` does not cross `/` (use `**`). It sees the specifier as written, not the
  resolved path. A later `overrides` entry replaces the rule for the files it matches, so a
  stricter folder must repeat the base patterns.
- `zod/mini` still added ~30 KB to a 76 KB bundle; weigh valibot when bundle size matters.
- `Bun.WebView.evaluate` takes an expression: wrap statements in `(() => { … })()`.
