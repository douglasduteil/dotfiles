# npm preferences / quirks

## allowScripts is advisory-only (as of npm 11.17.0)

`allowScripts` (`package.json`) + `npm approve-scripts`/`npm
deny-scripts` is a real npm feature, but currently advisory-only —
confirmed via `npm help approve-scripts`: "install scripts still run
by default... A future release will block unreviewed install
scripts." It does NOT block anything today and does NOT override
`ignore-scripts=true` in `.npmrc`. The actual current gate is still
`ignore-scripts` (blunt global on/off, no per-package exceptions).

Once npm ships the future default-block release, `allowScripts`
becomes the real gate and `ignore-scripts=true` + manual postinstall
workarounds become redundant. Don't assume that's already true.
