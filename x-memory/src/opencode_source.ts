import { $ } from "bun";
import type { SourceSession } from "./index_action";

interface OpencodeSessionListItem {
  id: string;
  updated: number;
  directory: string;
}

// Pure parsing/validation, split out from the `$`-calling wrappers below
// so the stable-interface regression tests can exercise it directly with
// fixture JSON, without needing to mock Bun's shell.
export function parseSessionList(raw: string, project: string): SourceSession[] {
  // `opencode session list` for a directory with no sessions emits empty
  // (or whitespace-only) stdout. That's a legitimate "no history here",
  // not corruption — return [] rather than throwing on JSON.parse("").
  if (raw.trim() === "") return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`opencode session list --format json returned an unexpected shape (expected an array): ${JSON.stringify(parsed)}`);
  }

  return parsed
    .map((s): OpencodeSessionListItem => {
      const item = s as Partial<OpencodeSessionListItem>;
      if (typeof item.id !== "string" || typeof item.updated !== "number" || typeof item.directory !== "string") {
        throw new Error(
          `opencode session list --format json returned an unexpected shape (expected {id: string, updated: number, directory: string}): ${JSON.stringify(s)}`,
        );
      }
      return item as OpencodeSessionListItem;
    })
    // `session list` is already scoped by the subprocess's cwd; this is
    // a defensive second check against the same scope-constraint mistake
    // ticket 01's regression test guards against on the Claude Code side.
    .filter((s) => s.directory === project)
    .map((s) => ({ sourceSessionId: s.id, sessionModifiedAt: s.updated }));
}

function textFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        typeof p === "object" && p !== null && (p as { type?: unknown }).type === "text" && typeof (p as { text?: unknown }).text === "string",
    )
    .map((p) => p.text)
    .join("\n");
}

// ponytail: same tail-only cap as claude_code_source.ts, kept as a
// separate literal rather than a shared constant — one number, two
// files, not worth a module for.
const MAX_EXTRACTED_TEXT_LENGTH = 20_000;

export function parseExportText(raw: string): string {
  const parsed: unknown = JSON.parse(raw);
  const messages = (parsed as { messages?: unknown } | null | undefined)?.messages;
  if (!Array.isArray(messages)) {
    throw new Error(`opencode export returned an unexpected shape (expected {messages: [...]}): ${JSON.stringify(parsed)}`);
  }

  const text = messages
    .map((m) => textFromParts((m as { parts?: unknown } | null | undefined)?.parts))
    .filter(Boolean)
    .join("\n\n");
  return text.length > MAX_EXTRACTED_TEXT_LENGTH ? text.slice(-MAX_EXTRACTED_TEXT_LENGTH) : text;
}

// Reads only through opencode's own stable CLI surface (`session list`,
// `export`), never its underlying event-sourced SQLite database directly
// — that storage format already migrated once mid-investigation of this
// spec, per implementation-decisions.md's "reading through stable
// interfaces" constraint.
export async function listOpencodeSessions(project: string): Promise<SourceSession[]> {
  const result = await $`opencode session list --format json`.cwd(project).quiet();
  return parseSessionList(result.stdout.toString(), project);
}

export async function extractOpencodeSessionText(sessionId: string, project: string): Promise<string> {
  const result = await $`opencode export ${sessionId}`.cwd(project).quiet();
  return parseExportText(result.stdout.toString());
}
