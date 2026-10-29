# Why this constitution exists: TypeScript is not Lean

TypeScript's checker is unsound by design. Lean's kernel proves; TypeScript's
checker only constrains. This constitution makes the unsound surface small,
explicit and counted, so the rest of the code can be trusted the way a proof is.

A type is a claim about data ("this was parsed", "this state is complete",
"every case is handled"). The only proof of the claim is the single function
allowed to build that type.

| Lean concept | TypeScript equivalent | Strength |
| --- | --- | --- |
| Proposition as type | Branded or discriminated type | Medium: nominal only by convention |
| Proof term | Smart constructor or parser returning a result | Strong if it is the only constructor |
| Totality | Exhaustive switch reaching `never` | Strong, with lint |
| `sorry` and axioms | `as`, `any`, `!`, `@ts-expect-error`, third-party `.d.ts` | Ledgered (Article VI) |
| Small trusted kernel | Compiler plus a few boundary parsers | Strong if parsers are few |
| Effect tracking | None built in; folder tsconfig and lint | Weak unless enforced (pure core module) |
| Dependent types | Generics, template literal types | Weak; avoid type-level gymnastics |

Purity is not checkable by the type system: a function typed `(a: A) => B` can
call `fetch`. Rigor comes from small trusted kernels, not clever types.

## Proofs have a location

| Guarantee | Enforced by |
| --- | --- |
| Strict checker flags | Compiler (strict tsconfig module) |
| Core cannot call I/O globals; never imports the shell | Compiler and oxlint (pure core module) |
| `Intl` in the core gets explicit locale and time zone | Review |
| Exhaustive handling of unions (Article IV) | Compiler; oxlint `switch-exhaustiveness-check` when active |
| Inputs become domain types (Articles III, V) | Runtime parser at the boundary |
| Configuration is valid (Article V) | Startup parser |
| Scoped reads require a principal (Article V) | Compiler (provenance brand); Postgres RLS underneath |
| Every `as` is visible; the hatch count never grows silently (Article VI) | Review; oxlint and CI (oxlint, hatch ledger modules) |
| Behavioral properties (Article VII) | CI tests (property tests module) |
