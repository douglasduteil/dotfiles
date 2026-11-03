# htmx

## The default trigger is chosen by tag (2.0.11, 2026-11-02)

An element with `hx-get`/`hx-post` and no `hx-trigger` falls back to `click`
(`change` for `input`/`textarea`/`select`, `submit` for `form`). A container carrying a
request verb therefore fires that request on every click inside it: a page
button's click sent its own `page=2` request and the wrapper's stale `page=1`
one. Give wrapper and polling elements an explicit `hx-trigger`, or attach
the request attributes only while the feature is on.
