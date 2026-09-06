import { parseEntryId } from "./entry_id";
import { globalIndexDbPath, indexDbPath } from "./project";
import type { Scope } from "./reducer";
import { openStore } from "./storage";

function dbPathForScope(project: string, scope: Scope): string {
  return scope === "global" ? globalIndexDbPath() : indexDbPath(project);
}

function mutate(project: string, entryId: string, scope: Scope, action: "REJECT" | "PIN"): boolean {
  const { sourceTool, sourceSessionId } = parseEntryId(entryId);
  const store = openStore(dbPathForScope(project, scope));
  try {
    return !!store.upsert({ type: action, sourceTool, sourceSessionId });
  } finally {
    store.close();
  }
}

// Returns false when no entry with this id exists yet in the target
// scope's store — the caller should report that as "nothing to reject",
// not silently treat it as success.
export function rejectEntry(project: string, entryId: string, scope: Scope = "project"): boolean {
  return mutate(project, entryId, scope, "REJECT");
}

export function pinEntry(project: string, entryId: string, scope: Scope = "project"): boolean {
  return mutate(project, entryId, scope, "PIN");
}
