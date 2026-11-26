---
name: x-tsx-components
description: TSX component separation, compound components and shared view state: split views into a pure view model, one composing page, branch-free sections and named parts around one provider. Use when writing, reviewing or refactoring TSX/JSX with any runtime (React, Preact, jsx-dom, hono/jsx), when a view grows conditional blocks, or when designing view props or shared state.
---

# TSX component separation

A view has three tiers. Each tier owns one job:

| Tier        | Job                                                                                    | Lives in                                                              |
| ----------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Decide**  | Read session, env, DB; choose variants; format values (`JSON.stringify`, `Intl`, URLs) | the handler, or a pure `to_*_view(input) → ViewModel` mapper it calls |
| **Compose** | Choose which section renders in each region                                            | the page component                                                    |
| **Render**  | Emit markup from already-decided data                                                  | section and layout components, branch-free                            |

This is Article II of `x-ts-constitution` (decisions pure, effects at the edge) applied to views. Its Article III §3 (unions over flags) governs the view model.
The tiers and rules hold for any JSX runtime, DOM builders (`jsx-dom`) and string renderers (`hono/jsx`) alike: the runtime changes how markup is emitted, not how a view is split or where state lives.

## Steps

1. **Draw the boxes.** Name every visible region of the page (each heading and its content, the layout, repeated rows) and every variant of the data (signed in or anonymous, empty or filled). Each region and each variant is a candidate component, named after what the user sees: `UserInfoSection`, `BetaInteractions`. Source: [Thinking in React, step 1](https://react.dev/learn/thinking-in-react).
   Done when: every region of the page has a name.
2. **Build the view model.** Write the type the page receives: a discriminated union for each set of states that go together (`session: { kind: "anonymous" } | { kind: "signed_in"; userinfo: string; … }`). One independent gate may stay a single boolean. Fill it in the handler or a pure mapper, with every value already formatted. Source: [Choosing the state structure, avoid contradictions](https://react.dev/learn/choosing-the-state-structure).
   Done when: the view model is complete enough that no component reads raw session, env or request.
3. **Compose the page.** The page lists its regions top to bottom. Where a region depends on data, the page holds exactly one decision for it: a ternary to a named child (`{view.beta ? <BetaInteractions /> : null}`) or an exhaustive `switch` over `kind`. An absent region is an absent child. Where siblings need the same state, lift it to one provider that owns the store before composing them. Source: [Conditional rendering](https://react.dev/learn/conditional-rendering): "conditionally include or exclude the component in the parent component's JSX".
   Done when: each region costs the page at most one decision, every conditional picks a named component, and any shared state has one provider above both consumers.
4. **Render the sections.** Each section takes narrow props: only the values it prints, or the narrowed union variant. Non-optional props remove the guards. Shared chrome (doctype, `<html>`, `<head>`, footer) goes in a layout component that takes `children`. Source: [Passing props, children](https://react.dev/learn/passing-props-to-a-component).
   Done when: section bodies contain markup and value interpolation, and their props are non-optional.
5. **Check the stopping rule.** Keep a component when its name is a region or a variant the user would recognise. Inline it back when it is a one-use wrapper that adds no markup and makes no decision. Repetition beats a premature abstraction: "There's nothing wrong with repetitive code—it can be more legible" ([Passing props](https://react.dev/learn/passing-props-to-a-component)).
   Done when: every component either names a region or variant, or is used in two or more places.

## Rules

- **Extract on these signals:** nested conditional markup; more than one decision for a region; mixed concerns in one return (formatting plus layout plus several regions); props passed through a component that does not use them ([Passing data deeply](https://react.dev/learn/passing-data-deeply-with-context)). Lint thresholds (complexity, JSX depth, function length) are alarms, never targets.
- **Composition over configuration.** A wrapper takes `children`, or named element props for several slots; pass JSX children for static structure rather than `renderX` functions so the page keeps the decision. Split a second mode boolean into explicit variant components that share sections, or replace the booleans with one union prop.
- **One provider owns state.** Lift state to the smallest provider that spans the siblings needing it; that provider is the only place that knows how the store is managed. Give consumers a typed `{ state, actions, meta }` surface through props or shared context, so the implementation can be swapped without touching them. Direct children get props; deeper slots get context. Components receive that surface; they never read raw session, env or request.
- **Compound components.** Build a complex view as a provider plus named child slots; the provider shares the typed surface through context, and siblings meet through those slots.
- **Conditions are booleans.** The left side of `&&` and the test of a ternary are real booleans (`items.length > 0`), so `0`, `NaN` and `""` never reach the output.
- **Components are top-level, PascalCase, rendered as JSX** (`<Section />`). Files, props, mappers and variables follow the repo's naming (snake_case in the user's baseline). JSX treats a lowercase tag as an HTML element, and hono renders `<user_info />` as a custom tag with no type error.
- **JSX renders DOM nodes only.** Use `<Component />` for functions returning a `ReactNode`; keep void side-effect helpers, data helpers and factories returning parts as snake_case calls.
- **File layout:** `views/layout.tsx`, one file per page holding its exported page component and its unexported sections, and the view-model type next to the page or in `view_models.ts`. A section moves to its own file when a second page imports it ([Importing and exporting components](https://react.dev/learn/importing-and-exporting-components)).

## Branches

- hono/jsx (server-side rendering): read [hono.md](hono.md) for escaping, `raw()`, doctype, context, and the values hono prints.
- Setting up or tightening lint for TSX: read [lint.md](lint.md).
- Complex views with sibling parts sharing state: read [compound.md](compound.md) for the provider, the typed `{ state, actions, meta }` surface, named slots and explicit variants.
