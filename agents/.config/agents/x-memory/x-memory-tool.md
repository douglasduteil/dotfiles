# x-memory CLI usage

## Reindex before trusting an empty result

`x-memory query --project <dir> [--search "<term>"]` can return
"No recap found" even when sessions exist, if the local index is
stale or was never built for that project. Empty result is not proof
of no history — run `x-memory index --project <dir>` first, then
retry the query.
