# Browser rendering performance

Learned 2026-10-06 on a canvas-heavy landing page.

## Measuring Firefox CPU (headless)

- `nix build nixpkgs#firefox --no-link --print-out-paths` fetches it into the store only; no
  profile install.
- Launch: `firefox --headless --no-remote --profile <tmpdir> --window-size=1440,900 <url>`.
- CSS ablations without automation: put overrides in `<profile>/chrome/userContent.css` and
  set `user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true)` in `user.js`.
- Metric: utime+stime from `/proc/<pid>/stat`, summed over the whole process tree (walk the
  ppid links). Take the median of three 4 s samples after a 10 s warmup. Single short runs
  varied from 24 to 121 % for the same page.
- Chrome trace counts (RasterTask/Paint = 0) are not proof that a page is fast: compositing
  cost does not show up in them.

## Canvas 2D gotchas

- `new Path2D("… A 50 50 0 0 0 …")` with the arc radius exactly half the chord rendered as
  full circles in Chromium. Build such shapes with `arc()` instead.
- Fading trails with `destination-out` at a tiny per-frame alpha leaves faint 8-bit residue
  forever (`a × (1 − d)` rounds back up). Fade in ~100 ms steps (bigger `d`); the residue
  stays at ≤ ~1 % alpha.
