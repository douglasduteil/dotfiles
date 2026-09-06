// opencode plugin: indexes Claude Code's recent activity on `session.created`
// and injects a one-line breadcrumb into every chat.system.transform call
// via experimental.chat.system.transform (opencode has no SessionStart-
// equivalent hook — issue #5409 at spec time). Never mutates any file
// (e.g. AGENTS.md) — see implementation-decisions.md#hook-wiring for why
// that approach was rejected.
import type { Plugin } from "@opencode-ai/plugin";
import { formatBreadcrumb, summarizeSource } from "../breadcrumb";
import { indexClaudeCode } from "../index_action";
import { resolveProjectRoot } from "../project";

const INDEX_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))]);
}

export const XMemoryPlugin: Plugin = async ({ directory }) => {
  let breadcrumb: string | undefined;

  async function refresh(dir: string): Promise<void> {
    try {
      const project = await resolveProjectRoot(dir);
      await withTimeout(indexClaudeCode(project), INDEX_TIMEOUT_MS);
      const summary = summarizeSource(project, "claude-code");
      breadcrumb = summary ? formatBreadcrumb(summary, Date.now()) : undefined;
    } catch {
      // opencode's own storage being unavailable, Claude Code not
      // installed, a shape regression — none of these should ever break
      // a chat turn. Silence is the correct degrade.
      breadcrumb = undefined;
    }
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await refresh(event.properties.info.directory ?? directory);
      }
    },
    "experimental.chat.system.transform": async (_input, output) => {
      if (breadcrumb) output.system.push(breadcrumb);
    },
  };
};

export default XMemoryPlugin;
