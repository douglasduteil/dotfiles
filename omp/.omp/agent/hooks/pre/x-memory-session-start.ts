// Stow package for omp's user agent dir (~/.omp/agent/hooks/pre/). omp
// discovers .ts factories here and loads them as extension modules; the
// real implementation lives in x-memory so claude-code/opencode wiring
// stays in one tree. Bun resolves this stowed symlink by realpath, so
// the relative import points at the dotfiles checkout.
export { default, buildSessionBreadcrumb } from "../../../../../x-memory/src/hooks/omp_session_start";
