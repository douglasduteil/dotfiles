import { homedir } from "node:os";
import { $ } from "bun";

export async function resolveProjectRoot(cwd: string = process.cwd()): Promise<string> {
  try {
    const result = await $`git -C ${cwd} rev-parse --show-toplevel`.quiet();
    const root = result.stdout.toString().trim();
    if (root) return root;
  } catch {
    // not inside a git repository — fall back to cwd, per implementation-decisions.md
  }
  return cwd;
}

export function indexDbPath(projectRoot: string): string {
  return `${projectRoot}/.agents/x-memory/index.db`;
}

// XDG cache dir, not `~/.config/agents` (implementation-decisions.md's
// original pick): that path is this dotfiles repo's own stow-managed
// symlink, so a derived/rebuildable cache written there would land
// inside version control. A real, non-repo-managed directory needs no
// gitignore workaround for something that shouldn't be repo content at all.
export function globalIndexDbPath(): string {
  const cacheHome = process.env.XDG_CACHE_HOME || `${homedir()}/.cache`;
  return `${cacheHome}/x-memory/index.db`;
}
