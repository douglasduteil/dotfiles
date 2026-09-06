import { describe, expect, mock, test } from "bun:test";

const indexClaudeCodeMock = mock(async () => ({ indexed: 0 }));
const summarizeSourceMock = mock(() => ({ sourceTool: "claude-code" as const, count: 3, mostRecentAt: 1000 }));
const resolveProjectRootMock = mock(async (dir: string) => dir);

mock.module("../index_action", () => ({ indexClaudeCode: indexClaudeCodeMock }));
mock.module("../breadcrumb", () => ({
  summarizeSource: summarizeSourceMock,
  formatBreadcrumb: (s: { count: number; sourceTool: string }) => `x-memory: ${s.count} ${s.sourceTool} sessions`,
}));
mock.module("../project", () => ({ resolveProjectRoot: resolveProjectRootMock }));

const { XMemoryPlugin } = await import("./opencode_session_plugin");

describe("opencode session plugin", () => {
  test("session.created triggers index() and primes the breadcrumb; system.transform writes it", async () => {
    const hooks = await XMemoryPlugin({ directory: "/repo" } as never, undefined as never);

    await hooks.event!({ event: { type: "session.created", properties: { info: { directory: "/repo" } } } } as never);

    expect(indexClaudeCodeMock).toHaveBeenCalledWith("/repo");
    expect(summarizeSourceMock).toHaveBeenCalledWith("/repo", "claude-code");

    const output = { system: [] as string[] };
    await hooks["experimental.chat.system.transform"]!({ model: {} } as never, output);

    expect(output.system).toEqual(["x-memory: 3 claude-code sessions"]);
  });

  test("system.transform is a no-op before any session.created event has fired", async () => {
    const hooks = await XMemoryPlugin({ directory: "/repo" } as never, undefined as never);

    const output = { system: [] as string[] };
    await hooks["experimental.chat.system.transform"]!({ model: {} } as never, output);

    expect(output.system).toEqual([]);
  });

  test("an indexing failure degrades to silence, not a thrown error", async () => {
    indexClaudeCodeMock.mockRejectedValueOnce(new Error("boom"));
    const hooks = await XMemoryPlugin({ directory: "/repo" } as never, undefined as never);

    await hooks.event!({ event: { type: "session.created", properties: { info: { directory: "/repo" } } } } as never);

    const output = { system: [] as string[] };
    await hooks["experimental.chat.system.transform"]!({ model: {} } as never, output);
    expect(output.system).toEqual([]);
  });
});
