# Compound components with one provider

For a complex view whose parts share state, expose named parts around a single
provider. The provider is the only place that knows how the state is managed;
consumers compose exactly the parts they need.

The pattern is runtime-agnostic. React and Preact use context; DOM-only runtimes
can hold the same typed surface on the provider's frame and let its named parts
read it. The contract is the surface, not the framework API.

## Steps

1. **Name the parts.** List the visible regions the consumer should be able to
   compose (`Frame`, `Header`, `Input`, `Footer`, `Submit`) and the variants of
   the whole view. Each part and each variant becomes a named component.
   Done when: every region a consumer may include has a part name.
2. **Give the provider one typed surface.** Lift shared state to the smallest
   provider that spans the parts. It supplies `{ state, actions, meta }`; only
   the provider knows the store. Parts read that surface; they never import a
   store or read raw session, env or request data.
   Done when: no part reaches past the surface for its data.
3. **Expose named slots.** Export the parts on one object
   (`const Composer = { Provider, Frame, Input, Submit, Footer }`). Each part
   renders markup from the surface and `children`; consumers pass children or
   named slots, never `renderX` functions or `showX` flags.
   Done when: a consumer can build a variant by listing parts, with no hidden
   conditionals inside the parent.
4. **Compose each variant explicitly.** A variant lists exactly the parts it
   renders. Sharing internals happens between parts, not through a monolithic
   parent with mode booleans.
   Done when: every variant is a plain composition and no mode boolean remains.

## Shape

```tsx
const Composer = {
  Provider: ComposerProvider, // owns { state, actions, meta }
  Frame: ComposerFrame, // takes children
  Header: ComposerHeader,
  Input: ComposerInput, // reads the surface
  Footer: ComposerFooter,
  Submit: ComposerSubmit,
};
```

```tsx
<Composer.Provider surface={surface}>
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Submit />
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

## Rules

- **Surface over prop drilling.** Intermediate parts accept `children`; they do
  not forward `state`, `actions` or `meta` through several layers.
- **Explicit variants.** Name each variant after what the user sees (`ThreadComposer`, `EditMessageComposer`); each states its provider, its parts and its actions. Add a variant by composing shared parts, not by adding a boolean the parent must interpret.
- **Children for static structure.** Compose named parts as children; a function prop that renders fixed markup moves that region's decision out of the page. A render prop earns its place only when the parent must hand data back to the child (`renderItem`), never to arrange a fixed layout.
- **Provider owns implementation.** The provider alone knows whether state is local, global or synced; parts consume only the typed `{ state, actions, meta }` surface. Swap providers without changing the UI.
- **Provider scope, not visual nesting.** Lift shared state above every consumer, including siblings outside the frame; they read the same surface. Components do not sync state upward through callbacks or read it from refs at submit time.
