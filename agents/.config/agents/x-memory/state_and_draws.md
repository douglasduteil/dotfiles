# Subtle rule shapes

Before writing a rule that tracks a milestone, a best-so-far, or a random pick
from a table.

- **A milestone is stored, not derived.** `current >= threshold` re-fires when the
  value falls and rises again, and leaves nothing for what comes next to hang on.
  Store the flag (`met: boolean`, set once) and let the display read it. (2026-11-19:
  a representative "met at a fame threshold" that re-announced every dive, and whose
  gift had no state to attach to.)
- **A best-so-far seeded with `0` lies over signed values.** A run of negative
  results reports a best of `0` it never earned. Start it empty (`null`) and let the
  first value set it; make the display say "no result yet". (2026-11-19: a high score
  that read `0` for a run of poor dives.)
- **A probability gate is not a uniform source.** After `roll < odds` the accepted
  values all sit in `[0, odds)`, so indexing a table by the same roll can only ever
  pick the first entries. Gate on one roll, pick on another, and test that every
  entry shows up. (2026-11-19: a shop whose items could only carry the first of four
  qualities.)
