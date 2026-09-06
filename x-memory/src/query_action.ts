import type { QueryResultEntry, Scope } from "./reducer";
import { globalIndexDbPath, indexDbPath } from "./project";
import { openStore } from "./storage";

export interface QueryOptions {
  scope?: Scope;
  searchTerm?: string;
  clock?: number;
}

// Two-tier scope (implementation-decisions.md#two-tier-scope): a caller
// asking about "this project" with no explicit scope gets project-scoped
// results plus any relevant global entries, read from the two separate
// physical files. ponytail: results are concatenated project-then-global,
// not cross-corpus re-ranked (each file's FTS5 bm25 scores aren't
// comparable across two separate indexes) — upgrade if that ordering
// ever matters more than "both show up".
export function queryProject(project: string, options: QueryOptions = {}): QueryResultEntry[] {
  const clock = options.clock ?? Date.now();
  const searchTerm = options.searchTerm;

  if (options.scope === "global") {
    return withStore(globalIndexDbPath(), (store) => store.query({ project, scope: "global", searchTerm, clock }));
  }

  if (options.scope === "project") {
    return withStore(indexDbPath(project), (store) => store.query({ project, scope: "project", searchTerm, clock }));
  }

  const projectResults = withStore(indexDbPath(project), (store) =>
    store.query({ project, scope: "project", searchTerm, clock }),
  );
  const globalResults = withStore(globalIndexDbPath(), (store) =>
    store.query({ project, scope: "global", searchTerm, clock }),
  );
  return [...projectResults, ...globalResults];
}

function withStore<T>(dbPath: string, fn: (store: ReturnType<typeof openStore>) => T): T {
  const store = openStore(dbPath);
  try {
    return fn(store);
  } finally {
    store.close();
  }
}
