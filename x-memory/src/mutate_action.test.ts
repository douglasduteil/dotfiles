import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeEntryId } from "./entry_id";
import { pinEntry, rejectEntry } from "./mutate_action";
import { indexDbPath } from "./project";
import { queryProject } from "./query_action";
import { openStore } from "./storage";

let project: string;
let cacheHome: string;
const originalCacheHome = process.env.XDG_CACHE_HOME;

function seedProjectEntry() {
  const store = openStore(indexDbPath(project));
  store.upsert({
    type: "INDEX",
    entry: {
      id: makeEntryId("claude-code", "cc-1"),
      scope: "project",
      project,
      sourceTool: "claude-code",
      sourceSessionId: "cc-1",
      sessionModifiedAt: 100,
      createdAt: 100,
      extractedText: "fixed a bug",
      rejected: false,
      pinned: false,
    },
  });
  store.close();
}

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), "x-memory-mutate-"));
  cacheHome = mkdtempSync(join(tmpdir(), "x-memory-cache-"));
  process.env.XDG_CACHE_HOME = cacheHome;
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  rmSync(cacheHome, { recursive: true, force: true });
  process.env.XDG_CACHE_HOME = originalCacheHome;
});

describe("rejectEntry / pinEntry", () => {
  test("reject excludes the entry from a project-scope query", () => {
    seedProjectEntry();

    expect(rejectEntry(project, makeEntryId("claude-code", "cc-1"))).toBe(true);

    expect(queryProject(project, { scope: "project", clock: 100 })).toEqual([]);
  });

  test("pin exempts the entry from staleness regardless of clock", () => {
    seedProjectEntry();

    expect(pinEntry(project, makeEntryId("claude-code", "cc-1"))).toBe(true);

    const [result] = queryProject(project, { scope: "project", clock: 365 * 24 * 60 * 60 * 1000 });
    expect(result?.stale).toBe(false);
  });

  test("returns false for an id that doesn't exist in the target scope", () => {
    expect(rejectEntry(project, makeEntryId("claude-code", "never-indexed"))).toBe(false);
  });

  test("reject with --scope global targets the global-tier store, not the project one", () => {
    const globalStore = openStore(`${cacheHome}/x-memory/index.db`);
    globalStore.upsert({
      type: "INDEX",
      entry: {
        id: makeEntryId("opencode", "oc-1"),
        scope: "global",
        project,
        sourceTool: "opencode",
        sourceSessionId: "oc-1",
        sessionModifiedAt: 100,
        createdAt: 100,
        extractedText: "always use conventional commits",
        rejected: false,
        pinned: false,
      },
    });
    globalStore.close();

    expect(rejectEntry(project, makeEntryId("opencode", "oc-1"), "global")).toBe(true);
    expect(queryProject(project, { scope: "global", clock: 100 })).toEqual([]);
  });
});
