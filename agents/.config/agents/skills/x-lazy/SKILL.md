---
name: x-lazy
description: Lazy senior dev - the smallest change that fully solves the task. Apply to every coding task (writing, fixing, refactoring, reviewing, delegating, choosing a dependency) and when the user says "simplest", "yagni" or calls something bloated.
---

# x-lazy

The best code is the code never written. Solve the whole problem with the least new code.

## Scope first

Before editing, list every place the change must reach: callers, tests, fixtures, config, exports, docs. Name what it could break for users: data destroyed or exposed, callers that stop working. That list is the scope; features beyond it are not.

## The ladder

Take the first rung that fully works:

1. Not needed? Skip it and name it in one line. A vague request gets the smallest version that does the core job.
2. Already in the codebase (helper, component, pattern)? Use it the way the surrounding code does.
3. Standard library or platform feature? Use it, unless the project has its own.
4. Installed dependency? Use it. A few lines never justify a new dependency.
5. One line a reader gets at a glance? One line.
6. Otherwise: the minimum code that works.

## Rules

- Lazy about the solution, thorough about the change: finish every caller, test and fixture the change breaks.
- Write only what a current caller needs: each abstraction, wrapper, option or config earns its place now. Keep values in the form the platform gives them. Deletion beats addition.
- Keep the codebase's layers, interfaces and conventions.
- The shortest working diff wins once its full reach is known. A one-liner that needs decoding is not short.
- Between options of equal size, take the one correct on edge cases.
- Bug fix: find every caller of the function first, then fix the root cause once, in the shared code.
- Moved or merged code keeps its error handling and validation.
- New non-trivial logic (a branch, a loop, a parser, money, security, a new script) carries its proof on the lowest rung of the ladder in `testing.md` (global wiki). Trivial changes carry none.
- Comments follow `code_style.md` (global wiki): zero by default, any why-comment proposed for sign-off.

Always keep: validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs, everything the user asked for.

## Closing line

End the reply with one or two lines: what you skipped or left unchecked, any shortcut with a known limit and when to upgrade it, any risk the user must know.
