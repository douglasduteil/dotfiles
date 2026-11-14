# Postgres data migrations

Descriptive: re-verify on upgrade.

- node-pg-migrate 8.0.3 (2026-11-12): the CLI's `--single-transaction` defaults to true, so the runner opens one
  `BEGIN` around every pending migration. `pgm.db.query` runs immediately inside it; `pgm.noTransaction()`
  only wraps the migration's queued SQL steps in `COMMIT`/`BEGIN`. Batching inside `up` neither commits
  progressively nor shortens row locks: write one set-based statement instead.
- Planner, PGlite (2026-11-12): `unnest($1::int[])` sources and data-modifying CTEs are estimated at a handful
  of rows, so a `NOT EXISTS` against a table with no index on the join keys becomes a nested-loop anti-join:
  O(n²), still running after 15 min at 300k rows. Read the lookup sets flat into memory, decide in code, then
  run one `UPDATE`/`DELETE … USING unnest(…)` by primary key; it finished in 20 s.
- PGlite smoke test of a `pg_dump` schema: the dump runs `set_config('search_path', '', false)`, so run
  `SET search_path TO public` after loading it.
