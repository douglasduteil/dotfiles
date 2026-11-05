# Shell gotchas

## zsh: a word starting with `=` is a command lookup (zsh 5.9.2, 2026-11-05)

EQUALS expansion turns `=cmd` into the path of `cmd`. `echo ===` therefore
fails with `zsh:1: == not found` (exit 1) and stops a `&&`/`;` chain mid-way.
Agent tools that run with a pty use the login shell, which may be zsh.
Use `---` or quote it (`echo "==="`) for output separators.
