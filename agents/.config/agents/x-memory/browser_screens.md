# Browser screens: the frame loop and its proof

Learned 2026-11-18, on a DOM-over-canvas screen driven by `requestAnimationFrame`.

## The frame loop

- A throw inside a `requestAnimationFrame` callback stops the loop: the next
  `requestAnimationFrame` sits after the throwing line and is never reached, and nothing
  else reports it. The screen freezes, its completion callback never fires, and no timer
  is left to recover. Treat any throw in the callback as screen death.
- Reschedule in `finally`, or keep the callback throw-free: compute what changed before
  any lookup that can throw.
- One action can add an entity to the next state (a summon, a spawned unit, a called
  regular). A render diff must treat an id absent from the previous state as **new**, never
  look it up. In a diff, absence is a birth, not an error.
- Rebuild derived view state (positions, plates, name maps) for the new state *before*
  showing it. The frame that shows the new state must already hold a key for every entity
  in it; deferring the rebuild to the next turn leaves one frame pointing at nothing.

## Proving it

- A green rules test suite says nothing about the screen. Move the diff into a pure
  selector, unit-test the added-entity case, and let the screen only consume it.
- To prove the screen itself, serve a throwaway page **outside** the repo that imports the
  screen module by absolute path. That module's own `#alias` and asset imports still
  resolve through its nearest `package.json`, so the harness needs no copy and no repo
  change. Mount it with a crafted state that triggers the case, assert the DOM through
  `Bun.WebView.evaluate`, and take a screenshot.
- To capture the failing state, revert the fix in place, rerun the same harness, keep the
  exact error string, then restore the file by checksum. One pair of runs beats a theory.
- DOM presence is not visibility: an entity can own a plate and a cast and still hide
  behind another sprite on the canvas. Read the pixels, not only the nodes.
