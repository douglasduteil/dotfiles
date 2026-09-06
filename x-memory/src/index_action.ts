import {
  extractSessionText,
  listClaudeCodeSessions,
} from "./claude_code_source";
import { makeEntryId } from "./entry_id";
import {
  extractOpencodeSessionText,
  listOpencodeSessions,
} from "./opencode_source";
import { globalIndexDbPath, indexDbPath } from "./project";
import type { Scope, SourceTool } from "./reducer";
import { openStore } from "./storage";

export interface SourceSession {
  sourceSessionId: string;
  sessionModifiedAt: number;
}

export interface IndexOptions {
  rebuild?: boolean;
  scope?: Scope;
}

export interface IndexResult {
  indexed: number;
}

interface SourceAdapter {
  sourceTool: SourceTool;
  listSessions(project: string): Promise<SourceSession[]>;
  extractText(sessionId: string, project: string): Promise<string>;
}

async function indexSource(
  project: string,
  adapter: SourceAdapter,
  options: IndexOptions = {},
): Promise<IndexResult> {
  const scope = options.scope ?? "project";
  const store = openStore(
    scope === "global" ? globalIndexDbPath() : indexDbPath(project),
  );
  try {
    const watermark = options.rebuild
      ? 0
      : store.getWatermark(project, adapter.sourceTool);
    let sessions: SourceSession[];
    try {
      sessions = await adapter.listSessions(project);
    } catch (err) {
      // A truncated `opencode session list` stream (or any source listing
      // failure) leaves us with no sessions at all. Nothing to skip —
      // degrade to an empty index rather than crash the run. Log loudly so
      // a rare silence isn't mistaken for "no history".
      console.error(
        `Failed to list ${adapter.sourceTool} sessions for ${project}: ${(err as Error).message}`,
      );
      return { indexed: 0 };
    }
    const now = Date.now();
    let indexed = 0;
    let maxSeen = watermark;

    // Each extractText() spawns a subprocess (opencode export / SDK call)
    // whose per-call startup cost dominates wall time when awaited one at
    // a time. Extracting concurrently turns N sequential round-trips into
    // one round-trip's worth of wall time; store writes stay sequential
    // below since sqlite writes serialize anyway and order doesn't matter
    // (maxSeen is a running max, not append order).
    const due = sessions.filter((s) => s.sessionModifiedAt > watermark);
    const extracted = await Promise.all(
      due.map(async (session) => {
        try {
          return {
            session,
            extractedText: await adapter.extractText(session.sourceSessionId, project),
          };
        } catch (err) {
          // A single session whose export is corrupt/truncated (e.g. a
          // truncated opencode `export` stream) must not abort the whole
          // run — skip it loudly and keep indexing the rest. The per-session
          // watermark advance below means a later good session moves the
          // watermark past this one, so it won't be retried; the log is that
          // session's only record.
          console.error(
            `Skipping session ${adapter.sourceTool}:${session.sourceSessionId} (${project}): ${(err as Error).message}`,
          );
          return undefined;
        }
      }),
    );

    // The watermark advances after each successful session, not once at
    // the end: if a session is skipped (extract failed), sessions already
    // indexed this run stay durably past the watermark instead of being
    // re-fetched and re-attempted on every future run. Tracked as a
    // running max (sessions aren't guaranteed to arrive sorted) so the
    // watermark never regresses below what's already been indexed.
    for (const result of extracted) {
      if (!result) continue;
      const { session, extractedText } = result;
      store.upsert({
        type: "INDEX",
        entry: {
          id: makeEntryId(adapter.sourceTool, session.sourceSessionId),
          scope,
          project,
          sourceTool: adapter.sourceTool,
          sourceSessionId: session.sourceSessionId,
          sessionModifiedAt: session.sessionModifiedAt,
          createdAt: now,
          extractedText,
          rejected: false,
          pinned: false,
        },
      });
      indexed += 1;
      maxSeen = Math.max(maxSeen, session.sessionModifiedAt);
      store.setWatermark(project, adapter.sourceTool, maxSeen);
    }

    return { indexed };
  } finally {
    store.close();
  }
}

export function indexClaudeCode(
  project: string,
  options: IndexOptions = {},
): Promise<IndexResult> {
  return indexSource(
    project,
    {
      sourceTool: "claude-code",
      listSessions: listClaudeCodeSessions,
      extractText: extractSessionText,
    },
    options,
  );
}

export function indexOpencode(
  project: string,
  options: IndexOptions = {},
): Promise<IndexResult> {
  return indexSource(
    project,
    {
      sourceTool: "opencode",
      listSessions: listOpencodeSessions,
      extractText: extractOpencodeSessionText,
    },
    options,
  );
}
