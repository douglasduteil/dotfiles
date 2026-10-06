import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const guard_config =
  /(agent\/config\.yml|claude\/settings\.json|opencode\.jsonc?|hooks\/pre\/x-guard\.ts|rules\/constitution\.md)$/;
const path_tools: Record<string, boolean> = { ast_edit: true, edit: true, find: true, glob: true, grep: true, read: true, write: true };
const secret_store =
  /(^|\/)(\.aws|\.config\/gh|\.gnupg|\.ssh|sops\/age)(\/|$)|(^|\/)(\.git-credentials|\.netrc|hosts\.yml)$/;
const write_tools: Record<string, boolean> = { ast_edit: true, edit: true, write: true };

type ToolCall = { input?: Record<string, unknown>; toolName: string };

export function blocked_reason(
  tool_name: string,
  input: Record<string, unknown>,
  cwd: string,
): string | undefined {
  if (!path_tools[tool_name]) return;
  for (const path of target_paths(input, cwd)) {
    if (secret_store.test(path) && !path.endsWith(".pub")) {
      return `x-guard: ${path} is a secret store. A denial means stop: tell the user what is blocked and ask.`;
    }
    if (write_tools[tool_name] && guard_config.test(path)) {
      return `x-guard: ${path} is agent guard config. The user edits it, never the agent.`;
    }
  }
}

function target_paths(input: Record<string, unknown>, cwd: string): string[] {
  const raw = typeof input.path === "string" ? input.path.split(";") : [];
  if (typeof input.input === "string") {
    for (const header of input.input.matchAll(/^\[(.+?)#[0-9A-Fa-f]{4}\]$/gm)) raw.push(header[1]);
  }
  return raw.flatMap((path) => {
    const bare = path.trim().replace(/:[^/]*$/, "");
    const absolute = resolve(cwd, bare.replace(/^~(?=\/|$)/, homedir()));
    try {
      return [bare, absolute, realpathSync(absolute)];
    } catch {
      return [bare, absolute];
    }
  });
}

export default function x_guard(pi: {
  on(
    event: "tool_call",
    handler: (event: ToolCall, ctx: { cwd?: string }) => Promise<unknown>,
  ): void;
}): void {
  pi.on("tool_call", async (event, ctx) => {
    const reason = blocked_reason(event.toolName, event.input ?? {}, ctx?.cwd ?? process.cwd());
    if (reason) return { block: true, reason };
  });
}
