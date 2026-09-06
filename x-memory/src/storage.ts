import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  type Action,
  type Entry,
  type QueryParams,
  type QueryResultEntry,
  type RollupGroup,
  type Scope,
  type SourceSessionRef,
  query as reducerQuery,
  recencyBoost,
  reduce,
  rollup as reducerRollup,
  withStale,
} from "./reducer";

export interface Store {
  upsert(action: Action): Entry | undefined;
  query(params: QueryParams): QueryResultEntry[];
  rollup(params: { project: string; scope?: Scope }): RollupGroup[];
  getWatermark(project: string, sourceTool: string): number;
  setWatermark(project: string, sourceTool: string, watermark: number): void;
  close(): void;
}

const ROW_COLUMNS =
  "id, scope, project, source_tool, source_session_id, session_modified_at, created_at, extracted_text, rejected, pinned";

interface Row {
  id: string;
  scope: Scope;
  project: string;
  source_tool: Entry["sourceTool"];
  source_session_id: string;
  session_modified_at: number;
  created_at: number;
  extracted_text: string;
  rejected: number;
  pinned: number;
}

function rowToEntry(row: Row): Entry {
  return {
    id: row.id,
    scope: row.scope,
    project: row.project,
    sourceTool: row.source_tool,
    sourceSessionId: row.source_session_id,
    sessionModifiedAt: row.session_modified_at,
    createdAt: row.created_at,
    extractedText: row.extracted_text,
    rejected: !!row.rejected,
    pinned: !!row.pinned,
  };
}

// FTS5's default MATCH syntax treats space-separated terms as an implicit
// AND; OR-joining keeps a multi-word search from requiring every word to
// appear. Returns undefined for a term with no real words (e.g. all
// whitespace) — FTS5 throws a syntax error on an empty MATCH query.
function toFtsOrQuery(searchTerm: string): string | undefined {
  const terms = searchTerm
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replace(/"/g, '""')}"`);
  return terms.length > 0 ? terms.join(" OR ") : undefined;
}

function candidateFilter(scope: Scope | undefined, alias = ""): string {
  const col = (name: string) => (alias ? `${alias}.${name}` : name);
  return `${col("rejected")} = 0 AND (${col("scope")} = 'global' OR ${col("project")} = ?)${scope ? ` AND ${col("scope")} = ?` : ""}`;
}

function candidateParams(project: string, scope: Scope | undefined): string[] {
  return scope ? [project, scope] : [project];
}

export function openStore(dbPath: string): Store {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      project TEXT NOT NULL,
      source_tool TEXT NOT NULL,
      source_session_id TEXT NOT NULL,
      session_modified_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      extracted_text TEXT NOT NULL,
      rejected INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0,
      UNIQUE(source_tool, source_session_id)
    );
  `);
  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(id UNINDEXED, extracted_text);`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS watermarks (
      project TEXT NOT NULL,
      source_tool TEXT NOT NULL,
      watermark INTEGER NOT NULL,
      PRIMARY KEY (project, source_tool)
    );
  `);

  function findBySession(ref: SourceSessionRef): Entry | undefined {
    const row = db
      .query<Row, [string, string]>(`SELECT ${ROW_COLUMNS} FROM entries WHERE source_tool = ? AND source_session_id = ?`)
      .get(ref.sourceTool, ref.sourceSessionId);
    return row ? rowToEntry(row) : undefined;
  }

  // Transactional: a process death between the entries write and the FTS
  // write must never leave a row indexed-but-unsearchable (or vice versa).
  const persist = db.transaction((entry: Entry) => {
    db.query(
      `INSERT INTO entries (${ROW_COLUMNS})
       VALUES ($id, $scope, $project, $sourceTool, $sourceSessionId, $sessionModifiedAt, $createdAt, $extractedText, $rejected, $pinned)
       ON CONFLICT(source_tool, source_session_id) DO UPDATE SET
         id = excluded.id, scope = excluded.scope, project = excluded.project,
         session_modified_at = excluded.session_modified_at, created_at = excluded.created_at,
         extracted_text = excluded.extracted_text, rejected = excluded.rejected, pinned = excluded.pinned`,
    ).run({
      $id: entry.id,
      $scope: entry.scope,
      $project: entry.project,
      $sourceTool: entry.sourceTool,
      $sourceSessionId: entry.sourceSessionId,
      $sessionModifiedAt: entry.sessionModifiedAt,
      $createdAt: entry.createdAt,
      $extractedText: entry.extractedText,
      $rejected: entry.rejected ? 1 : 0,
      $pinned: entry.pinned ? 1 : 0,
    });
    db.query(`DELETE FROM entries_fts WHERE id = ?`).run(entry.id);
    db.query(`INSERT INTO entries_fts (id, extracted_text) VALUES (?, ?)`).run(entry.id, entry.extractedText);
  });

  function loadCandidates(project: string, scope: Scope | undefined): Entry[] {
    const rows = db
      .query<Row, string[]>(`SELECT ${ROW_COLUMNS} FROM entries WHERE ${candidateFilter(scope)}`)
      .all(...candidateParams(project, scope));
    return rows.map(rowToEntry);
  }

  return {
    upsert(action) {
      const ref: SourceSessionRef = action.type === "INDEX" ? action.entry : action;
      const previous = findBySession(ref);
      const state = reduce({ entries: previous ? [previous] : [] }, action);
      const entry = state.entries.find((e) => e.sourceTool === ref.sourceTool && e.sourceSessionId === ref.sourceSessionId);
      if (entry) persist(entry);
      return entry;
    },
    query(params) {
      if (!params.searchTerm) {
        return reducerQuery({ entries: loadCandidates(params.project, params.scope) }, params);
      }

      const ftsQuery = toFtsOrQuery(params.searchTerm);
      if (!ftsQuery) return [];

      // Ranks with SQLite's own FTS5 bm25() directly, combined with the
      // reducer's recency curve — the single source of relevance for
      // real, stored data (see the ponytail note on reducer.ts's naive
      // relevance(), which stays only for the in-memory/no-storage path).
      const rows = db
        .query<Row & { rank: number }, (string | number)[]>(`
          SELECT ${ROW_COLUMNS.split(", ")
            .map((c) => `e.${c}`)
            .join(", ")}, bm25(entries_fts) AS rank
          FROM entries_fts
          JOIN entries e ON e.id = entries_fts.id
          WHERE entries_fts MATCH ? AND ${candidateFilter(params.scope, "e")}
        `)
        .all(ftsQuery, ...candidateParams(params.project, params.scope));

      return rows
        .map((row) => ({
          entry: rowToEntry(row),
          score: -row.rank + recencyBoost(row.session_modified_at, params.clock),
        }))
        .sort((a, b) => b.score - a.score)
        .map((r) => withStale(r.entry, params.clock));
    },
    rollup(params) {
      return reducerRollup({ entries: loadCandidates(params.project, params.scope) }, params);
    },
    getWatermark(project, sourceTool) {
      const row = db
        .query<{ watermark: number }, [string, string]>(`SELECT watermark FROM watermarks WHERE project = ? AND source_tool = ?`)
        .get(project, sourceTool);
      return row?.watermark ?? 0;
    },
    setWatermark(project, sourceTool, watermark) {
      db.query(
        `INSERT INTO watermarks (project, source_tool, watermark) VALUES (?, ?, ?)
         ON CONFLICT(project, source_tool) DO UPDATE SET watermark = excluded.watermark`,
      ).run(project, sourceTool, watermark);
    },
    close() {
      db.close();
    },
  };
}
