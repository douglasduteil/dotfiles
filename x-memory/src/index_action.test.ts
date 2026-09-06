import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const listSessionsMock = mock();
const getSessionMessagesMock = mock();

mock.module("@anthropic-ai/claude-agent-sdk", () => ({
  listSessions: listSessionsMock,
  getSessionMessages: getSessionMessagesMock,
}));

const { indexClaudeCode } = await import("./index_action");
const { queryProject } = await import("./query_action");

let project: string;

afterEach(() => {
  listSessionsMock.mockReset();
  getSessionMessagesMock.mockReset();
  if (project) rmSync(project, { recursive: true, force: true });
});

describe("indexClaudeCode", () => {
  test("a second run only re-indexes sessions modified since the watermark", async () => {
    project = mkdtempSync(join(tmpdir(), "x-memory-index-"));
    getSessionMessagesMock.mockResolvedValue([
      { message: { role: "user", content: "hi" } },
    ]);

    listSessionsMock.mockResolvedValueOnce([
      { sessionId: "s1", lastModified: 100 },
    ]);
    expect((await indexClaudeCode(project)).indexed).toBe(1);

    listSessionsMock.mockResolvedValueOnce([
      { sessionId: "s1", lastModified: 100 },
      { sessionId: "s2", lastModified: 200 },
    ]);
    expect((await indexClaudeCode(project)).indexed).toBe(1);

    const recap = queryProject(project, { scope: "project", clock: 200 });
    expect(recap[0]?.entry.sourceSessionId).toBe("s2");
  });

  test("a session that fails to extract is skipped loudly, not to the exclusion of the rest", async () => {
    project = mkdtempSync(join(tmpdir(), "x-memory-index-"));
    listSessionsMock.mockResolvedValue([
      { sessionId: "s1", lastModified: 100 },
      { sessionId: "s2", lastModified: 200 },
      { sessionId: "s3", lastModified: 300 },
    ]);
    getSessionMessagesMock.mockImplementation(async (sessionId: string) => {
      if (sessionId === "s2") throw new Error("SDK shape regression");
      return [{ message: { role: "user", content: "hi" } }];
    });

    const result = await indexClaudeCode(project);
    expect(result.indexed).toBe(2);

    expect(
      queryProject(project, { scope: "project", clock: 100 })[0]?.entry
        .sourceSessionId,
    ).toBe("s3");
  });

  test("--rebuild re-indexes everything regardless of watermark", async () => {
    project = mkdtempSync(join(tmpdir(), "x-memory-index-"));
    getSessionMessagesMock.mockResolvedValue([
      { message: { role: "user", content: "hi" } },
    ]);
    listSessionsMock.mockResolvedValue([
      { sessionId: "s1", lastModified: 100 },
    ]);

    await indexClaudeCode(project);
    const result = await indexClaudeCode(project, { rebuild: true });

    expect(result.indexed).toBe(1);
  });

  test("a truncated session list degrades to an empty index, not a crash", async () => {
    project = mkdtempSync(join(tmpdir(), "x-memory-index-"));
    listSessionsMock.mockRejectedValue(
      new Error("JSON Parse error: Unexpected EOF"),
    );

    const result = await indexClaudeCode(project);

    expect(result.indexed).toBe(0);
    expect(queryProject(project, { scope: "project", clock: 100 })).toEqual([]);
  });
});
