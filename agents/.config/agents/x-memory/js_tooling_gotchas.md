# JS/TS tooling gotchas

Descriptive only: how a tool behaved at a given version, found by hands-on testing. Each line carries the version and date; re-verify or delete it when the tool upgrades. TypeScript preferences live in the `x-ts-constitution` skill.

## TypeScript 7

- `prettier-plugin-organize-imports` 4.3.0 is a silent no-op on `typescript` 7.0.2: TS 7.0 ships no compiler API (`require("typescript").createLanguageService` is `undefined`), Prettier exits 0 and leaves imports unsorted and unused ones in place. Affects every TS 7 repo listing the plugin (api-partenaires, hyyypertool, idp-status-monitoring, release-action, federation mocks). Check: pipe a file with an unused import through `prettier --stdin-filepath src/x.ts` (2026-10-19). Fix options: `typescript` aliased to `npm:@typescript/typescript6` plus `@typescript/native` for TS 7's `tsc`, or `prettier-plugin-sort-imports`, or drop the plugin.

## Bun runtime

- `Bun.serve()`'s `{dir: ...}` static-route shorthand throws ("Failed to resolve react-server-dom-bun/server") when an ancestor `package.json` has react/next as a dependency: it triggers Bun's fullstack-framework auto-detection. Serve manually via `Bun.file()` in a wildcard route handler, and re-add path-traversal guarding yourself (version not recorded).
- `Bun.WebView`: `click()`/`type()` resolve once the action is dispatched, not once a triggered navigation completes. Poll `view.url` (or similar) before the next DOM interaction, or intermittent failures/hangs follow. Undocumented as of Bun 1.3.
- `Bun.WebView` headless smoke check / screenshot (Bun 1.4.2, 2026-10-01): serve the page (`bun --port=3917 page.html` in the background), then `const view = new Bun.WebView({ width, height })`, `await view.navigate(url)`, poll `view.loading` until false, `await view.evaluate("<js string>")` for DOM text, `await view.screenshot()` returns PNG bytes for `Bun.write`, `view.close()`. Other methods: `click`, `type`, `press`, `scroll`, `resize`, `reload`, `cdp`. For rare UI checks, not CI.
- `Bun.WebView.type(text)` is single-arg: it types into the focused element. Click/focus the target first (Bun 1.4.2).
- `Bun.WebView.evaluate` takes an expression: wrap statements in `(() => { … })()` (Bun 1.4.2, 2026-10-03).
- `Bun.markdown.render()`'s per-node callbacks are all-or-nothing: passing any callback drops the default HTML wrapper for every node type not also handled. Use `.html()` for default rendering and pre/post-process the Markdown or HTML string instead (version not recorded).
- Bun 1.4.2 has no `import.meta.glob`: the bundler leaves the call in and it throws at runtime. Use a hand-written registry plus a test that lists the folders. `bun test` imports modules that import `.css` without trouble (2026-10-03, x-blades).

### Dev server: imports in a cycle are `null` at load

`bun <file>.html` (dev server, HMR) wraps each module; inside an import cycle the imported binding is still `null` while the module body runs. The production bundle (`bun build`) hoists and works, so a build-only smoke test misses it. Never read an imported function at module load (`el.onclick = show_menu`); wrap it (`el.onclick = () => show_menu()`). Hit in x-blades game screens, 2026-10-02 (`TypeError: … import_menu3 is null`).

## Sentry local testing

- The DSN validator rejects a bare `localhost` hostname (no dot); `127.0.0.1` works.
- The DSN public-key segment rejects hyphens (real keys are hex, so this only bites test fixtures).
- `Sentry.init()` does not throw on an invalid DSN: it logs a warning and silently no-ops, so `captureException()`/`flush()` look like they did nothing, not like the DSN was bad.

(SDK version not recorded.)

## Editor tooling

- typescript-mcp `ts_diagnostics` can keep a stale buffer after on-disk edits: it reported 30 phantom "Duplicate identifier" errors on a 441-line file. Trust `tsc --noEmit` (2026-10-14).
