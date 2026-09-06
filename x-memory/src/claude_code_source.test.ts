import { afterEach, describe, expect, mock, test } from "bun:test";

const listSessionsMock = mock();
const getSessionMessagesMock = mock();

mock.module("@anthropic-ai/claude-agent-sdk", () => ({
  listSessions: listSessionsMock,
  getSessionMessages: getSessionMessagesMock,
}));

const { extractSessionText, listClaudeCodeSessions } = await import("./claude_code_source");

afterEach(() => {
  listSessionsMock.mockReset();
  getSessionMessagesMock.mockReset();
});

describe("listClaudeCodeSessions", () => {
  test("maps a well-formed SDK response", async () => {
    listSessionsMock.mockResolvedValue([{ sessionId: "cc-1", lastModified: 1000 }]);

    const sessions = await listClaudeCodeSessions("/repo");

    expect(sessions).toEqual([{ sourceSessionId: "cc-1", sessionModifiedAt: 1000 }]);
    expect(listSessionsMock).toHaveBeenCalledWith({ dir: "/repo", includeWorktrees: false });
  });

  // Stable-interface regression: a renamed/missing field on the SDK's
  // response must fail loudly, not silently write undefined/NaN into the index.
  test("throws when the SDK response shape breaks", async () => {
    listSessionsMock.mockResolvedValue([{ id: "cc-1", mtime: 1000 }]);

    await expect(listClaudeCodeSessions("/repo")).rejects.toThrow(/unexpected shape/);
  });
});

describe("extractSessionText", () => {
  test("skips a null/undefined message entry instead of throwing", async () => {
    getSessionMessagesMock.mockResolvedValue([null, { message: { role: "user", content: "still works" } }]);

    expect(await extractSessionText("cc-1", "/repo")).toBe("still works");
  });

  test("extracts from string-content messages", async () => {
    getSessionMessagesMock.mockResolvedValue([{ message: { role: "user", content: "fixed a bug" } }]);

    expect(await extractSessionText("cc-1", "/repo")).toBe("fixed a bug");
  });

  test("extracts text blocks from array-content messages, ignoring non-text blocks", async () => {
    getSessionMessagesMock.mockResolvedValue([
      {
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "refactored the parser" },
            { type: "tool_use", name: "Edit", input: {} },
          ],
        },
      },
    ]);

    expect(await extractSessionText("cc-1", "/repo")).toBe("refactored the parser");
  });

  // Stable-interface regression: getSessionMessages returning a non-array
  // (the shape opencode's storage migration would have broken) must fail
  // loudly rather than silently producing an empty recap.
  test("throws when the SDK response shape breaks", async () => {
    getSessionMessagesMock.mockResolvedValue({ messages: [] });

    await expect(extractSessionText("cc-1", "/repo")).rejects.toThrow(/unexpected shape/);
  });
});
