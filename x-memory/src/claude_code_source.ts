import { getSessionMessages, listSessions } from "@anthropic-ai/claude-agent-sdk";
import type { SourceSession } from "./index_action";

// Reads only through the Agent SDK's stable session surface, never the
// underlying JSONL transcript files, per the hard "reading through stable
// interfaces" constraint in implementation-decisions.md.
export async function listClaudeCodeSessions(project: string): Promise<SourceSession[]> {
  const sessions = await listSessions({ dir: project, includeWorktrees: false });
  return sessions.map((s) => {
    if (typeof s.sessionId !== "string" || typeof s.lastModified !== "number") {
      throw new Error(
        `@anthropic-ai/claude-agent-sdk listSessions() returned an unexpected shape (expected {sessionId: string, lastModified: number}): ${JSON.stringify(s)}`,
      );
    }
    return { sourceSessionId: s.sessionId, sessionModifiedAt: s.lastModified };
  });
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (block): block is { type: "text"; text: string } =>
        typeof block === "object" &&
        block !== null &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string",
    )
    .map((block) => block.text)
    .join("\n");
}

// ponytail: keeps only the tail of a very long transcript — a real
// recap needs the recent context most. Full-transcript retrieval or
// LLM-synthesized compression is a future opt-in, not this seam.
const MAX_EXTRACTED_TEXT_LENGTH = 20_000;

export async function extractSessionText(sessionId: string, project: string): Promise<string> {
  const messages = await getSessionMessages(sessionId, { dir: project });
  if (!Array.isArray(messages)) {
    throw new Error(
      `@anthropic-ai/claude-agent-sdk getSessionMessages() returned an unexpected shape (expected an array): ${JSON.stringify(messages)}`,
    );
  }
  const text = messages
    .map((m) => textFromContent((m as { message?: { content?: unknown } } | null | undefined)?.message?.content))
    .filter(Boolean)
    .join("\n\n");
  return text.length > MAX_EXTRACTED_TEXT_LENGTH ? text.slice(-MAX_EXTRACTED_TEXT_LENGTH) : text;
}
