# hono/jsx specifics

Checked against hono 4.13.14 on 2026-10-26. Re-verify after a hono major upgrade.

## Layout

- Plain composition: `const PageLayout = ({ children, title }: PropsWithChildren<{ title: string }>) => <html>…{children}</html>`, used by each page. Typed props, no global augmentation. Fits a handful of pages ([hono JSX guide](https://hono.dev/docs/guides/jsx)).
- `jsxRenderer` with `c.render()` fits when many routes or nested sub-apps share layouts. It prepends `<!DOCTYPE html>`. Extra props such as `title` need a `ContextRenderer` augmentation ([jsx-renderer](https://hono.dev/docs/middleware/builtin/jsx-renderer)).
- `c.html(<html>…)` emits no doctype: put `{raw("<!doctype html>")}` at the top of the layout.
- Components rendering `<title>`, `<meta>` or `<link>` get hoisted into `<head>`, without de-duplication.

## Escaping

- String children and attributes are escaped, including text inside `<style>` and `<script>`: `url("x")` becomes `url(&quot;x&quot;)`. Inline CSS or JS goes through `raw()` from `hono/html`, or `dangerouslySetInnerHTML`.
- `raw()` output is trusted as-is ([html helper](https://hono.dev/docs/helpers/html)). Apply it only to module constants, in the file that owns the constant, never to request data. A page-specific `<style>` reaches `<head>` through a layout slot prop (`head={<style>{raw(css)}</style>}`).

## Rendering values

- Children: `false`, `true`, `null`, `undefined` and `""` render nothing. `0` and `NaN` print, both as children and as a component's return value.
- Attributes: `null` and `undefined` drop the attribute. `false` drops only hono's listed boolean attributes (`disabled`, `checked`, …); `data-x={false}` prints `data-x="false"`.
- hono ships no `<Show>`/`<Switch>` control-flow components. A home-made `<Show when>` evaluates its children eagerly and does not narrow their types: choose the child in the parent instead.

## Context and direct calls

- `<Comp />` defers the call to render time. `Comp(props)` runs it at once.
- `useContext`, `useRequestContext()` and `<ErrorBoundary>` work only through JSX. Called as a function, a component reads the context's default value, `useRequestContext()` throws `RequestContext is not provided.`, and its errors bypass `ErrorBoundary`.
- A top-level page called from a `.ts` handler (`c.html(IndexPage(props))`) is safe while no component in its tree reads context. Render with JSX from a `.tsx` handler once one does.
