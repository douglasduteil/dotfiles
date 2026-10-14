# Learning path and exercises

Learn by retrofitting real code, one article at a time, and spend a few weeks writing actual Lean. Feeling what a real proof costs sharpens judgment about what TypeScript can and cannot promise.

Reading, in this order:

1. Gary Bernhardt, "Boundaries" talk: functional core, imperative shell.
2. Mark Seemann, "Dependency rejection" and the "impureim sandwich" posts.
3. Alexis King, "Parse, don't validate".
4. Scott Wlaschin, *Domain Modeling Made Functional*, and the "Designing with types" series.
5. *Functional Programming in Lean*, then *Theorem Proving in Lean 4*.

Exercises, each on a real module:

- [ ] Turn on `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in one repo; sort the errors into real bugs versus noise.
- [ ] Move the core into `src/core/` with its own tsconfig (`lib: ["ES2023"]`, `types: []`); list what stops compiling.
- [ ] Take one handler and draw its sandwich: what it reads, what it decides, what it writes.
- [ ] Replace one boolean-flag type with a union; count representable versus legal states before and after.
- [ ] Write one negative type test proving an illegal state cannot be built.
- [ ] Write three fast-check properties for one core decision.
- [ ] Count your escape hatches (the ledger), then halve the number.
- [ ] Port one small pure function to Lean and prove one property about it, for example that a discount is never negative.
