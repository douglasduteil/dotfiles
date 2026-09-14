#!/usr/bin/env bun
// SessionStart hook (Claude Code): reads stdin per
// https://code.claude.com/docs/en/hooks, indexes the *other* tool's
// (opencode's) recent activity on this project, and injects a one-line
// breadcrumb via additionalContext — plus the curated-memory router pages
// (~/.cache/agents/memory/index.md and <project>/.agents/x-memory/index.md,
// see AGENTS.md) so the read happens mechanically instead of relying on
// the agent to remember to do it. Never blocks or fails session
// start — this runs synchronously before every session, so any error or
// slowness here must degrade to silence, not a hook-error notice.
import { homedir } from "node:os";
import { indexOpencode } from "../index_action";
import { formatBreadcrumb, summarizeSource } from "../breadcrumb";
import { resolveProjectRoot } from "../project";

async function readIndexIfExists(path: string): Promise<string | null> {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.text();
}

async function buildMemoryContext(project: string): Promise<string | null> {
  const [global, local] = await Promise.all([
    readIndexIfExists(`${homedir()}/.cache/agents/memory/index.md`),
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

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  let cwd = process.cwd();
  try {
    const input = JSON.parse(await readStdin());
    if (typeof input?.cwd === "string") cwd = input.cwd;
  } catch {
    // malformed or empty stdin — fall back to process cwd
  }

  const project = await resolveProjectRoot(cwd);
  const parts: string[] = [];

  try {
    await withTimeout(indexOpencode(project), INDEX_TIMEOUT_MS);
    const summary = summarizeSource(project, "opencode");
    if (summary) parts.push(formatBreadcrumb(summary, Date.now()));
  } catch {
    // opencode not installed, no sessions yet, a shape regression, a
    // slow subprocess — none of these should ever block or error a
    // Claude Code session start. Silence is the correct degrade.
  }

  try {
    const memoryContext = await buildMemoryContext(project);
    if (memoryContext) parts.push(memoryContext);
  } catch {
    // missing/unreadable memory files should never block session start
  }

  const additionalContext = parts.length > 0 ? parts.join("\n\n") : undefined;

  if (additionalContext) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }));
  }
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
