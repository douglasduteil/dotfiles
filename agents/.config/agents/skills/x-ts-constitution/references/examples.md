# Worked examples

Longer illustrations of rules stated in `SKILL.md`. The rules, not these
examples, are normative.

## Article II — the 3-phase sandwich

```ts
// src/core/membership/decide_join.ts: pure, synchronous, total
export type JoinInput = {
  readonly invite: Invite | null;
  readonly now: Instant; // time is an input, never read
  readonly org: Org;
  readonly user: User;
};

export type JoinDecision =
  | { readonly kind: "join"; readonly events: readonly DomainEvent[]; readonly membership: NewMembership }
  | { readonly kind: "reject"; readonly reason: "already-member" | "invite-expired" | "org-full" };

export const decide_join = (input: JoinInput): JoinDecision => { /* ... */ };

// src/shell/http/join_handler.ts: impure, thin, no domain branching
export const join_handler = (deps: Deps) => async (req: Request) => {
  const input = await gather_join_input({ deps, req }); // 1. read
  const decision = decide_join(input);                  // 2. decide
  return execute_join({ decision, deps });              // 3. write and respond
};
```

## Article III §1 — parse at the boundary

```ts
const Email = z.email().brand<"Email">();
type Email = z.infer<typeof Email>;

// boundary: unknown -> Email, exactly once
const parsed = Email.safeParse(body.email);
// core: functions take Email, never string
const send_welcome = (to: Email): Command => ({ kind: "send-email", to });
```

```ts
export const Siren = z
  .string()
  .transform((s) => s.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{9}$/))
  .brand<"Siren">();
export type Siren = z.infer<typeof Siren>;
```

## Article III §4 — a decision keeps its reason

```ts
// Before: null hides two different outcomes
const find_owner = (records: readonly PartnerRecord[]): Siren | null => {
  const sirens = new Set(records.map((r) => r.siren));
  if (sirens.size !== 1) return null; // undeclared or shared? the caller cannot tell
  return [...sirens][0] ?? null;
};

// After: each outcome carries its evidence
type Ownership =
  | { readonly kind: "owned"; readonly siren: Siren }
  | { readonly kind: "shared"; readonly sirens: readonly [Siren, Siren, ...Siren[]] }
  | { readonly kind: "undeclared" };

const decide_ownership = (records: readonly PartnerRecord[]): Ownership => {
  const sirens = [...new Set(records.map((r) => r.siren))].sort();
  const [first, second, ...rest] = sirens;
  if (first === undefined) return { kind: "undeclared" };
  if (second === undefined) return { kind: "owned", siren: first };
  return { kind: "shared", sirens: [first, second, ...rest] };
};
```

The tuple is built without a cast, because `noUncheckedIndexedAccess` (set by
`@tsconfig/bun`) forces the `undefined` checks that prove the count. The sort
makes the result independent of input order. The `Set` deduplicates correctly
only because `Siren` is canonical (Article III §5).

## Article V — authorization is part of the port's type

```ts
// src/shell/http/auth.ts
declare const principal_brand: unique symbol;

export type Principal = {
  readonly [principal_brand]: true;
  readonly org_id: OrgId;
  readonly user_id: UserId;
};

export const principal_from_session = (session: VerifiedSession): Principal =>
  // oxlint-disable-next-line typescript/consistent-type-assertions -- provenance: built only from a verified session
  ({ org_id: session.org_id, user_id: session.user_id }) as Principal;

interface InvoiceStore {
  find_by_id(args: { readonly id: InvoiceId; readonly principal: Principal }): Promise<Invoice | undefined>;
  list_for_org(args: { readonly principal: Principal }): Promise<readonly Invoice[]>;
}
```

A plain object literal typed `Principal` fails with TS2741; forging one
elsewhere needs an `as`.
