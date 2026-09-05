import { describe, expect, test } from "bun:test";
import { type Entry, type State, initialState, query, reduce, rollup } from "./reducer";

const DAY = 24 * 60 * 60 * 1000;

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

function withEntries(...entries: Entry[]): State {
  return entries.reduce((state, entry) => reduce(state, { type: "INDEX", entry }), initialState);
}

describe("reducer", () => {
  test("happy path: opencode source session is queryable after indexing", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "oc-1", sourceTool: "opencode", extractedText: "fixed the login bug" }),
    );

    const [result] = query(state, { project: "/repo", clock: 0 });

    expect(result?.entry.sourceSessionId).toBe("oc-1");
  });

  test("reverse direction: claude-code source session is queryable after indexing", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "cc-1", sourceTool: "claude-code", extractedText: "refactored the parser" }),
    );

    const [result] = query(state, { project: "/repo", clock: 0 });

    expect(result?.entry.sourceSessionId).toBe("cc-1");
  });

  test("crash regression: a session with no clean end still produces a recap", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "cc-1", extractedText: "mid-work, terminal closed" }),
    );

    const [result] = query(state, { project: "/repo", clock: 0 });

    expect(result?.entry.sourceSessionId).toBe("cc-1");
  });

  test("wrong project: an entry indexed under project A is never returned for project B", () => {
    const state = withEntries(indexed({ id: "1", sourceSessionId: "cc-1", project: "/repo-a" }));

    const results = query(state, { project: "/repo-b", clock: 0 });

    expect(results).toEqual([]);
  });

  test("stale recap: past the threshold is flagged, within it is not", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "old", sessionModifiedAt: 0 }),
      indexed({ id: "2", sourceSessionId: "new", sessionModifiedAt: 8 * DAY, project: "/other" }),
    );

    const stale = query(state, { project: "/repo", clock: 8 * DAY });
    const fresh = query(state, { project: "/other", clock: 8 * DAY });

    expect(stale[0]?.stale).toBe(true);
    expect(fresh[0]?.stale).toBe(false);
  });

  test("concurrent sessions regression: both remain indexed, the newer one is current", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "cc-1", sourceTool: "claude-code", sessionModifiedAt: 100 }),
      indexed({ id: "2", sourceSessionId: "oc-1", sourceTool: "opencode", sessionModifiedAt: 200 }),
    );

    const [current] = query(state, { project: "/repo", clock: 200 });

    expect(current?.entry.sourceSessionId).toBe("oc-1");
    expect(state.entries).toHaveLength(2);
  });

  test("reject: excluded from query, and re-indexing the same session does not un-reject it", () => {
    let state = withEntries(indexed({ id: "1", sourceSessionId: "cc-1" }));
    state = reduce(state, { type: "REJECT", sourceTool: "claude-code", sourceSessionId: "cc-1" });

    expect(query(state, { project: "/repo", clock: 0 })).toEqual([]);

    state = reduce(state, { type: "INDEX", entry: indexed({ id: "1", sourceSessionId: "cc-1" }) });

    expect(query(state, { project: "/repo", clock: 0 })).toEqual([]);
  });

  test("pin: never flagged stale regardless of clock", () => {
    let state = withEntries(indexed({ id: "1", sourceSessionId: "cc-1", sessionModifiedAt: 0 }));
    state = reduce(state, { type: "PIN", sourceTool: "claude-code", sourceSessionId: "cc-1" });

    const [result] = query(state, { project: "/repo", clock: 365 * DAY });

    expect(result?.stale).toBe(false);
  });

  test("rollup: groups entries by date across several source sessions for one project", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "cc-1", sessionModifiedAt: 0 }),
      indexed({ id: "2", sourceSessionId: "cc-2", sessionModifiedAt: DAY }),
      indexed({ id: "3", sourceSessionId: "oc-1", sessionModifiedAt: DAY + 1000 }),
    );

    const groups = rollup(state, { project: "/repo" });

    expect(groups).toHaveLength(2);
    expect(groups[1]?.entries).toHaveLength(2);
  });

  test("search ranks a relevant recent entry over an old entry that only shares keywords", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "old", extractedText: "login bug fixed", sessionModifiedAt: 0 }),
      indexed({ id: "2", sourceSessionId: "new", extractedText: "login bug fixed", sessionModifiedAt: 30 * DAY }),
    );

    const results = query(state, { project: "/repo", searchTerm: "login bug", clock: 30 * DAY });

    expect(results[0]?.entry.sourceSessionId).toBe("new");
  });

  test("two-tier scope: a global entry is retrievable from any project", () => {
    const state = withEntries(indexed({ id: "1", sourceSessionId: "glob", scope: "global", project: "/origin" }));

    const results = query(state, { project: "/somewhere-else", clock: 0 });

    expect(results[0]?.entry.sourceSessionId).toBe("glob");
  });

  test("two-tier scope: a global-only query excludes project-scoped entries", () => {
    const state = withEntries(
      indexed({ id: "1", sourceSessionId: "proj", scope: "project" }),
      indexed({ id: "2", sourceSessionId: "glob", scope: "global" }),
    );

    const results = query(state, { project: "/repo", scope: "global", clock: 0 });

    expect(results.map((r) => r.entry.sourceSessionId)).toEqual(["glob"]);
  });
});
