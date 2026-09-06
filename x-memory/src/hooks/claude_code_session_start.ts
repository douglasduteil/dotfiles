#!/usr/bin/env bun
// SessionStart hook (Claude Code): reads stdin per
// https://code.claude.com/docs/en/hooks, indexes the *other* tool's
// (opencode's) recent activity on this project, and injects a one-line
// breadcrumb via additionalContext. Never blocks or fails session
// start — this runs synchronously before every session, so any error or
// slowness here must degrade to silence, not a hook-error notice.
import { indexOpencode } from "../index_action";
import { formatBreadcrumb, summarizeSource } from "../breadcrumb";
import { resolveProjectRoot } from "../project";

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

  let additionalContext: string | undefined;
  try {
    const project = await resolveProjectRoot(cwd);
    await withTimeout(indexOpencode(project), INDEX_TIMEOUT_MS);
    const summary = summarizeSource(project, "opencode");
    if (summary) additionalContext = formatBreadcrumb(summary, Date.now());
  } catch {
    // opencode not installed, no sessions yet, a shape regression, a
    // slow subprocess — none of these should ever block or error a
    // Claude Code session start. Silence is the correct degrade.
  }

  if (additionalContext) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }));
  }
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
