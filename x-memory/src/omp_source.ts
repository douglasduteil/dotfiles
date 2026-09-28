import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import type { SourceSession } from "./index_action";

// omp keeps no session-list/export CLI, so we read its on-disk JSONL
// sessions directly: `~/.omp/agent/sessions/<slug>/<timestamp>_<uuid>.jsonl`,
// where slug is "-" + the project cwd's basename (e.g.
// /home/nixos/.dotfiles -> `-.dotfiles`; bare `-` is the home dir).
export function ompSessionsDir(project: string): string {
  return join(homedir(), ".omp", "agent", "sessions", `-${basename(project)}`);
}

// Pure parsing/validation, split out from the filesystem wrappers below
// so tests can exercise it with fixture input, without real session files.
export function parseOmpSessionList(fileNames: string[]): SourceSession[] {
  return fileNames
    .filter((name) => name.endsWith(".jsonl"))
    .map((name): SourceSession => {
      const base = name.slice(0, -".jsonl".length);
      const underscore = base.lastIndexOf("_");
      const sourceSessionId = underscore === -1 ? base : base.slice(underscore + 1);
      if (sourceSessionId === "") {
        throw new Error(`omp session file name has no session id after "_": ${name}`);
      }
      // omp names carry no separate mtime; the modified time comes from the
      // file's newest entry timestamp, filled in by parseOmpSessionText.
      return { sourceSessionId, sessionModifiedAt: 0 };
    });
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

// ponytail: same tail-only cap as opencode_source.ts, kept as a separate
// literal rather than a shared constant — one number, two files.
const MAX_EXTRACTED_TEXT_LENGTH = 20_000;

interface ParsedOmpSession {
  text: string;
  modifiedAt: number;
}

export function parseOmpSessionText(raw: string): ParsedOmpSession {
  const texts: string[] = [];
  let newest = "";
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    let entry: unknown;
    try {
      entry = JSON.parse(line);
    } catch {
      // A truncated/corrupt line is skipped, not fatal — the session's
      // remaining entries still carry useful text.
      continue;
    }
    const ts = (entry as { timestamp?: unknown }).timestamp;
    if (typeof ts === "string" && ts > newest) newest = ts;
    if ((entry as { type?: unknown }).type !== "message") continue;
    const message = (entry as { message?: unknown }).message as
      | { role?: unknown; content?: unknown }
      | null
      | undefined;
    if (!message || (message.role !== "user" && message.role !== "assistant")) continue;
    const text = textFromParts(message.content);
    if (text) texts.push(text);
  }

  const text = texts.join("\n\n");
  return {
    text: text.length > MAX_EXTRACTED_TEXT_LENGTH ? text.slice(-MAX_EXTRACTED_TEXT_LENGTH) : text,
    modifiedAt: newest === "" ? 0 : Date.parse(newest),
  };
}

export async function listOmpSessions(project: string): Promise<SourceSession[]> {
  const dir = ompSessionsDir(project);
  let readdirNames: string[];
  try {
    readdirNames = await readdir(dir);
  } catch {
    // No sessions dir for this project's slug is a legitimate "no history
    // here", not corruption — same as opencode's empty stdout.
    return [];
  }
  const jsonlNames = readdirNames.filter((n) => n.endsWith(".jsonl"));
  const listed = parseOmpSessionList(jsonlNames);
  // Listing must fill in real modified times (from each file's newest
  // entry timestamp), since omp file names don't carry one.
  return Promise.all(
    listed.map(async (session, i) => {
      const fileName = jsonlNames[i];
      // parseOmpSessionList maps 1:1 over jsonlNames, but the indexed
      // access is still `string | undefined` under noUncheckedIndexedAccess.
      if (fileName === undefined) return session;
      const parsed = parseOmpSessionText(await Bun.file(join(dir, fileName)).text());
      return { sourceSessionId: session.sourceSessionId, sessionModifiedAt: parsed.modifiedAt };
    }),
  );
}

export async function extractOmpSessionText(sessionId: string, project: string): Promise<string> {
  const dir = ompSessionsDir(project);
  const fileNames = (await readdir(dir)).filter((name) => name.endsWith(`_${sessionId}.jsonl`));
  const fileName = fileNames[0];
  if (fileName === undefined) {
    throw new Error(`no omp session file found for ${sessionId} in ${dir}`);
  }
  return parseOmpSessionText(await Bun.file(join(dir, fileName)).text()).text;
}
