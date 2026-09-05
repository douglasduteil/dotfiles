export type Scope = "project" | "global";
export type SourceTool = "claude-code" | "opencode";

export interface Entry {
  id: string;
  scope: Scope;
  project: string;
  sourceTool: SourceTool;
  sourceSessionId: string;
  sessionModifiedAt: number;
  createdAt: number;
  extractedText: string;
  rejected: boolean;
  pinned: boolean;
}

export interface State {
  entries: Entry[];
}

export const initialState: State = { entries: [] };

export interface SourceSessionRef {
  sourceTool: SourceTool;
  sourceSessionId: string;
}

export type Action =
  | { type: "INDEX"; entry: Entry }
  | ({ type: "REJECT" } & SourceSessionRef)
  | ({ type: "PIN" } & SourceSessionRef);

function isSameSession(e: Entry, ref: SourceSessionRef): boolean {
  return e.sourceTool === ref.sourceTool && e.sourceSessionId === ref.sourceSessionId;
}

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case "INDEX": {
      const previous = state.entries.find((e) => isSameSession(e, action.entry));
      const rest = state.entries.filter((e) => !isSameSession(e, action.entry));
      const entry = previous
        ? { ...action.entry, createdAt: previous.createdAt, rejected: previous.rejected, pinned: previous.pinned }
        : action.entry;
      return { entries: [...rest, entry] };
    }
    case "REJECT":
      return {
        entries: state.entries.map((e) => (isSameSession(e, action) ? { ...e, rejected: true } : e)),
      };
    case "PIN":
      return {
        entries: state.entries.map((e) => (isSameSession(e, action) ? { ...e, pinned: true } : e)),
      };
  }
}

export const STALENESS_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export interface QueryParams {
  project: string;
  scope?: Scope;
  searchTerm?: string;
  clock: number;
}

export interface QueryResultEntry {
  entry: Entry;
  stale: boolean;
}

// Global-scoped entries are retrievable from any project (see two-tier
// scope): the project filter only ever applies to project-scoped rows.
function candidates(state: State, project: string, scope: Scope | undefined): Entry[] {
  return state.entries.filter((e) => {
    if (e.rejected) return false;
    if (scope !== undefined && e.scope !== scope) return false;
    return e.scope === "global" || e.project === project;
  });
}

// Exported so a real storage layer can attach the staleness flag to rows
// it ranked itself (e.g. via SQLite's FTS5 bm25), without duplicating
// this rule as a second, potentially-diverging copy.
export function withStale(entry: Entry, clock: number): QueryResultEntry {
  return {
    entry,
    stale: !entry.pinned && clock - entry.sessionModifiedAt > STALENESS_THRESHOLD_MS,
  };
}

// ponytail: naive substring-count relevance + linear recency decay, not
// FTS5. Only used by the no-storage pure-reducer path (in-memory tests,
// fixtures). A real query() shell ranks with SQLite's own FTS5 bm25()
// instead — see recencyBoost, exported for exactly that combination.
function relevance(text: string, term: string): number {
  const haystack = text.toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

export function recencyBoost(sessionModifiedAt: number, clock: number): number {
  const ageMs = Math.max(0, clock - sessionModifiedAt);
  return Math.max(0, 1 - ageMs / STALENESS_THRESHOLD_MS);
}

export function query(state: State, params: QueryParams): QueryResultEntry[] {
  const pool = candidates(state, params.project, params.scope);

  if (!params.searchTerm) {
    if (pool.length === 0) return [];
    const newest = pool.reduce((a, b) => {
      if (b.sessionModifiedAt !== a.sessionModifiedAt) return b.sessionModifiedAt > a.sessionModifiedAt ? b : a;
      return b.createdAt > a.createdAt ? b : a;
    });
    return [withStale(newest, params.clock)];
  }

  return pool
    .map((entry) => ({ entry, score: relevance(entry.extractedText, params.searchTerm!) }))
    .filter((r) => r.score > 0)
    .map((r) => ({ ...r, score: r.score + recencyBoost(r.entry.sessionModifiedAt, params.clock) }))
    .sort((a, b) => b.score - a.score)
    .map((r) => withStale(r.entry, params.clock));
}

export interface RollupGroup {
  date: string;
  entries: Entry[];
}

export function rollup(state: State, params: { project: string; scope?: Scope }): RollupGroup[] {
  const pool = candidates(state, params.project, params.scope);
  const byDate = new Map<string, Entry[]>();
  for (const entry of pool) {
    const d = new Date(entry.sessionModifiedAt);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDate.set(date, [...(byDate.get(date) ?? []), entry]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({ date, entries }));
}
