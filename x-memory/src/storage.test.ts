import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Entry } from "./reducer";
import { type Store, openStore } from "./storage";

let dbPath: string;
let store: Store;

function indexed(overrides: Partial<Entry> & Pick<Entry, "id" | "sourceSessionId">): Entry {
  return {
    scope: "project",
    project: "/repo",
    sourceTool: "claude-code",
    sessionModifiedAt: 0,
    createdAt: 0,
    extractedText: "",
    rejected: false,
    pinned: false,
    ...overrides,
  };
}

beforeEach(() => {
  dbPath = join(tmpdir(), `x-memory-storage-test-${Math.random().toString(36).slice(2)}.db`);
  store = openStore(dbPath);
});

afterEach(() => {
  store.close();
  rmSync(dbPath, { force: true });
  rmSync(`${dbPath}-wal`, { force: true });
  rmSync(`${dbPath}-shm`, { force: true });
});

describe("storage", () => {
  test("index then query round-trips through real SQLite", () => {
    store.upsert({ type: "INDEX", entry: indexed({ id: "1", sourceSessionId: "cc-1", extractedText: "fixed a bug" }) });

    const [result] = store.query({ project: "/repo", clock: 0 });

    expect(result?.entry.sourceSessionId).toBe("cc-1");
  });

  test("reject persists across process restart (reopening the same db file)", () => {
    store.upsert({ type: "INDEX", entry: indexed({ id: "1", sourceSessionId: "cc-1" }) });
    store.upsert({ type: "REJECT", sourceTool: "claude-code", sourceSessionId: "cc-1" });
    store.close();

    store = openStore(dbPath);
    expect(store.query({ project: "/repo", clock: 0 })).toEqual([]);
  });

  test("FTS5 search matches real full-text queries, not just exact phrase", () => {
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "1", sourceSessionId: "cc-1", extractedText: "refactored the login flow" }),
    });
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "2", sourceSessionId: "cc-2", project: "/repo", extractedText: "unrelated database work" }),
    });

    const results = store.query({ project: "/repo", searchTerm: "login", clock: 0 });

    expect(results.map((r) => r.entry.sourceSessionId)).toEqual(["cc-1"]);
  });

  test("watermark tracks per (project, source_tool) and defaults to 0", () => {
    expect(store.getWatermark("/repo", "claude-code")).toBe(0);

    store.setWatermark("/repo", "claude-code", 500);

    expect(store.getWatermark("/repo", "claude-code")).toBe(500);
    expect(store.getWatermark("/repo", "opencode")).toBe(0);
  });

  test("rollup groups persisted entries by date", () => {
    const DAY = 24 * 60 * 60 * 1000;
    store.upsert({ type: "INDEX", entry: indexed({ id: "1", sourceSessionId: "cc-1", sessionModifiedAt: 0 }) });
    store.upsert({ type: "INDEX", entry: indexed({ id: "2", sourceSessionId: "cc-2", sessionModifiedAt: DAY }) });

    expect(store.rollup({ project: "/repo" })).toHaveLength(2);
  });

  test("concurrent sessions: a claude-code and an opencode entry on the same project both persist, newer wins query", () => {
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "1", sourceSessionId: "cc-1", sourceTool: "claude-code", sessionModifiedAt: 100 }),
    });
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "2", sourceSessionId: "oc-1", sourceTool: "opencode", sessionModifiedAt: 200 }),
    });

    const [current] = store.query({ project: "/repo", clock: 200 });

    expect(current?.entry.sourceSessionId).toBe("oc-1");
    expect(store.rollup({ project: "/repo" }).flatMap((g) => g.entries)).toHaveLength(2);
  });

  test("an empty store has no entries to query", () => {
    expect(store.query({ project: "/repo", clock: 0 })).toEqual([]);
  });

  test("a whitespace-only search term returns no results instead of throwing an FTS5 syntax error", () => {
    store.upsert({ type: "INDEX", entry: indexed({ id: "1", sourceSessionId: "cc-1", extractedText: "hello" }) });

    expect(store.query({ project: "/repo", searchTerm: "   ", clock: 0 })).toEqual([]);
  });

  test("openStore creates missing parent directories instead of throwing", () => {
    const nestedPath = join(tmpdir(), `x-memory-nested-${Math.random().toString(36).slice(2)}`, "sub", "index.db");
    const nestedStore = openStore(nestedPath);
    nestedStore.close();
    rmSync(join(nestedPath, "..", ".."), { recursive: true, force: true });
  });

  test("search respects scope alongside FTS5 ranking", () => {
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "1", sourceSessionId: "proj", scope: "project", extractedText: "login flow" }),
    });
    store.upsert({
      type: "INDEX",
      entry: indexed({ id: "2", sourceSessionId: "glob", scope: "global", project: "/other", extractedText: "login flow" }),
    });

    const results = store.query({ project: "/repo", scope: "global", searchTerm: "login", clock: 0 });

    expect(results.map((r) => r.entry.sourceSessionId)).toEqual(["glob"]);
  });
});
