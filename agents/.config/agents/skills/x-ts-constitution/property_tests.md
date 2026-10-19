# Module: property tests

Adopt when a core decision carries a behavioral claim worth more than examples ("never grants a membership on an expired invite"). Needs `fast-check` as a dev dependency. Types prove shape; a property is the nearest thing TypeScript has to a theorem.

## Steps

Write the property next to the decision, in its `*.test.ts`:

```ts
import fc from "fast-check";

test("an expired invite never produces a membership", () => {
  fc.assert(
    fc.property(arb_join_input({ invite_expired: true }), (input) => {
      expect(decide_join(input).kind).toBe("reject");
    }),
  );
});
```

Families of properties:

- Round trip: `parse(serialize(x))` equals `x`.
- Idempotence: applying a decision twice equals applying it once. Critical for message workers.
- Invariants: a balance is never negative; a total equals the sum of its lines.
- Oracle: the optimized function (a SQL aggregation, say) agrees with the core decision on generated data.
- Order independence: shuffling the input never changes the decision. Catches any reliance on `records[0]`.
- Monotonicity: adding evidence never weakens a refusal; a new owner record never turns `shared` into `owned`. Each decision states whether it is monotone.

Arbitraries build values through the domain parsers, so a property never feeds the core an illegal state.

## Verify

Seed a bug in the decision (flip one branch); the property fails and fast-check prints a shrunk counterexample.
