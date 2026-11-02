import { describe, expect, test } from "bun:test";
import { makeEntryId, parseEntryId } from "./entry_id";
import { sourceTools } from "./reducer";

describe("entry_id", () => {
  test("round-trips every source tool through make/parse", () => {
    for (const sourceTool of sourceTools) {
      const id = makeEntryId(sourceTool, "abc-123");
      expect(parseEntryId(id)).toEqual({ sourceTool, sourceSessionId: "abc-123" });
    }
  });

  test("rejects an id with no separator", () => {
    expect(() => parseEntryId("no-colon-here")).toThrow(/expected/);
  });

  test("rejects an unknown source tool", () => {
    expect(() => parseEntryId("some-other-tool:abc")).toThrow(/unknown source tool/);
  });

  test("rejects an id with an empty session id", () => {
    expect(() => parseEntryId("claude-code:")).toThrow(/missing session id/);
  });
});
