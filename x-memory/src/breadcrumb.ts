import { indexDbPath } from "./project";
import type { SourceTool } from "./reducer";
import { openStore } from "./storage";

export interface SourceSummary {
  sourceTool: SourceTool;
  count: number;
  mostRecentAt: number;
}

// No count/sourceTool-filter primitive exists on Store yet (query/rollup
// only filter by scope+project), so this reuses rollup() and filters the
// already-loaded entries client-side rather than adding a new Store method
// for one caller.
export function summarizeSource(project: string, sourceTool: SourceTool): SourceSummary | null {
  const store = openStore(indexDbPath(project));
  try {
    const entries = store
      .rollup({ project, scope: "project" })
      .flatMap((g) => g.entries)
      .filter((e) => e.sourceTool === sourceTool);
    if (entries.length === 0) return null;
    const mostRecentAt = Math.max(...entries.map((e) => e.sessionModifiedAt));
    return { sourceTool, count: entries.length, mostRecentAt };
  } finally {
    store.close();
  }
}

function humanizeAge(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatBreadcrumb(summary: SourceSummary, clock: number): string {
  const plural = summary.count === 1 ? "session" : "sessions";
  const age = humanizeAge(Math.max(0, clock - summary.mostRecentAt));
  return `x-memory: ${summary.count} ${summary.sourceTool} ${plural} on this project, most recent ${age}.`;
}
