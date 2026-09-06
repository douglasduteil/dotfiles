import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeEntryId } from "./entry_id";
import { indexDbPath } from "./project";
import { queryProject } from "./query_action";
import { openStore } from "./storage";

let project: string;
let cacheHome: string;
const originalCacheHome = process.env.XDG_CACHE_HOME;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), "x-memory-query-"));
  cacheHome = mkdtempSync(join(tmpdir(), "x-memory-cache-"));
  process.env.XDG_CACHE_HOME = cacheHome;
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  rmSync(cacheHome, { recursive: true, force: true });
  process.env.XDG_CACHE_HOME = originalCacheHome;
});

describe("queryProject", () => {
  test("a brand-new, never-indexed project returns no recap instead of throwing", () => {
    expect(queryProject(project, { clock: 0 })).toEqual([]);
  });

  test("with no explicit scope, returns this project's entries plus applicable global entries", () => {
    const projectStore = openStore(indexDbPath(project));
    projectStore.upsert({
      type: "INDEX",
      entry: {
        id: makeEntryId("claude-code", "cc-1"),
        scope: "project",
        project,
        sourceTool: "claude-code",
        sourceSessionId: "cc-1",
        sessionModifiedAt: 100,
        createdAt: 100,
        extractedText: "project-specific work",
        rejected: false,
        pinned: false,
      },
    });
    projectStore.close();

    const globalStore = openStore(`${cacheHome}/x-memory/index.db`);
    globalStore.upsert({
      type: "INDEX",
      entry: {
        id: makeEntryId("opencode", "oc-1"),
        scope: "global",
        project: "/wherever-it-was-set",
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

    const results = queryProject(project, { clock: 100 });

    expect(results.map((r) => r.entry.sourceSessionId).sort()).toEqual(["cc-1", "oc-1"]);
  });
});
