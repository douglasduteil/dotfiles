// omp hook module: registers a `before_agent_start` handler that indexes
// the *other* tool's (opencode's) and omp's recent activity on this
// project, and injects a breadcrumb message — plus the curated-memory
// router pages (~/.config/agents/x-memory/index.md and
// <project>/.agents/x-memory/index.md, see AGENTS.md). Mirrors
// claude_code_session_start.ts. Never blocks or fails the agent — any
// error or slowness here must degrade to silence, not a hook-error
// notice.
import { homedir } from "node:os";
import { formatBreadcrumb, summarizeSource } from "../breadcrumb";
import { resolveProjectRoot } from "../project";

async function readIndexIfExists(path: string): Promise<string | null> {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.text();
}

async function buildMemoryContext(project: string): Promise<string | null> {
  const [global, local] = await Promise.all([
    readIndexIfExists(`${homedir()}/.config/agents/x-memory/index.md`),
    readIndexIfExists(`${project}/.agents/x-memory/index.md`),
  ]);
  const sections = [
    global && `## Global memory index\n\n${global.trim()}`,
    local && `## Project memory index\n\n${local.trim()}`,
  ].filter((s): s is string => Boolean(s));
  return sections.length > 0 ? sections.join("\n\n") : null;
}

const INDEX_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms)),
  ]);
}

// Exported for throwaway smoke tests; main wiring stays implicit below,
// like claude_code_session_start.ts.
export async function buildSessionBreadcrumb(cwd: string): Promise<string | null> {
  const project = await resolveProjectRoot(cwd);
  const parts: string[] = [];

  try {
    const { indexOpencode } = await import("../index_action");
    await withTimeout(indexOpencode(project), INDEX_TIMEOUT_MS);
    const summary = summarizeSource(project, "opencode");
    if (summary) parts.push(formatBreadcrumb(summary, Date.now()));
  } catch {
    // opencode not installed, no sessions yet, a shape regression, a
    // slow subprocess — none of these should ever block or error the
    // agent. Silence is the correct degrade.
  }

  try {
    // indexOmp is landing in index_action.ts concurrently with this file
    // (omp-source-indexer task); the dynamic import + graceful fallback
    // keeps this module loadable before that export exists.
    const { indexOmp } = await import("../index_action");
    await withTimeout(indexOmp(project), INDEX_TIMEOUT_MS);
    const summary = summarizeSource(project, "omp" as Parameters<typeof summarizeSource>[1]);
    if (summary) parts.push(formatBreadcrumb(summary, Date.now()));
  } catch {
    // indexOmp not merged yet, or omp indexing failed — degrade silently.
  }

  try {
    const memoryContext = await buildMemoryContext(project);
    if (memoryContext) parts.push(memoryContext);
  } catch {
    // missing/unreadable memory files should never block the agent
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

// omp hook modules default-export a factory receiving `pi`. Per omp docs
// (docs/hooks.md), `before_agent_start` is the pre-agent injected-message
// hook: the first returned `{ message: { customType, content, display } }`
// is kept. `session_start` has no documented message-return surface.
export default function xMemorySessionStart(pi: {
  on(
    event: "before_agent_start",
    handler: (event: unknown, ctx: { cwd: string }) => Promise<unknown>,
  ): void;
}): void {
  pi.on("before_agent_start", async (_event, ctx) => {
    const content = await buildSessionBreadcrumb(ctx.cwd).catch(() => null);
    if (!content) return;
    return {
      message: {
        customType: "x-memory-session-start",
        content,
        display: false,
      },
    };
  });
}
