# Linting TSX with oxlint

Checked against oxlint 1.89.0 on 2026-10-26 (`oxlint --rules`). Lint covers size and shape. Decision placement, unions over flags, narrow props and absent-child composition stay in review.

The `react` plugin is off by default, and setting `plugins` replaces the default set: list `["eslint", "typescript", "unicorn", "oxc", "react"]` ([plugins](https://oxc.rs/docs/guide/usage/linter/plugins.html)). New rules go in as `error`, with existing violations in the bulk-suppressions file (the `oxlint_type_aware.md` module of `x-ts-constitution`).

| Concern | Rule | Setting |
| --- | --- | --- |
| Too many branches | `eslint/complexity` | counts JSX `&&` and ternaries; default 20 |
| JSX nesting | `react/jsx-max-depth` | default 2 is unreachable for a layout; 4–5 works once the layout is extracted |
| Component length | `eslint/max-lines-per-function` | default 50 |
| Component defined inside a component | `react/no-unstable-nested-components` | |
| Component called as a function | `react/capitalized-calls` | flags calls inside components, not inside lowercase route handlers |
| Nested ternaries | `eslint/no-nested-ternary` | |
| Single-child fragments | `react/jsx-no-useless-fragment` | |
| Non-boolean conditions (`0 &&`, `"" &&`) | `typescript/strict-boolean-expressions` | type-aware; set `allowNumber: false` to flag `count &&` |
| Exhaustive `switch` over a union | `typescript/switch-exhaustiveness-check` | type-aware |
| File naming | `unicorn/filename-case` | `{ "case": "snakeCase" }` for snake_case files |

Leave these off:

- `react/no-multi-comp`: it conflicts with co-locating a page's private sections.
- `react/jsx-no-leaked-render`: oxlint lacks it. `strict-boolean-expressions` covers the same leaks.
