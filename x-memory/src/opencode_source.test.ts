import { describe, expect, test } from "bun:test";
import { parseExportText, parseSessionList } from "./opencode_source";

describe("parseSessionList", () => {
  test("maps a well-formed opencode session list response", () => {
    const raw = JSON.stringify([
      {
        id: "ses_1",
        title: "t",
        updated: 1000,
        created: 900,
        projectId: "p",
        directory: "/repo",
      },
    ]);

    expect(parseSessionList(raw, "/repo")).toEqual([
      { sourceSessionId: "ses_1", sessionModifiedAt: 1000 },
    ]);
  });

  test("filters out sessions from a different directory", () => {
    const raw = JSON.stringify([
      { id: "ses_1", updated: 1000, directory: "/repo" },
      { id: "ses_2", updated: 2000, directory: "/other" },
    ]);

    expect(parseSessionList(raw, "/repo")).toEqual([
      { sourceSessionId: "ses_1", sessionModifiedAt: 1000 },
    ]);
  });

  // Stable-interface regression: a renamed/missing field must fail
  // loudly, not silently under-index.
  test("throws when the response shape breaks", () => {
    const raw = JSON.stringify([{ sessionId: "ses_1", mtime: 1000 }]);

    expect(() => parseSessionList(raw, "/repo")).toThrow(/unexpected shape/);
  });

  test("throws when the response isn't an array", () => {
    expect(() =>
      parseSessionList(JSON.stringify({ sessions: [] }), "/repo"),
    ).toThrow(/unexpected shape/);
  });

  // Empty stdout from `opencode session list` for a dir with no sessions is
  // legitimate "no history", not corruption — return [] instead of crashing.
  test("treats empty output as an empty session list", () => {
    expect(parseSessionList("", "/repo")).toEqual([]);
    expect(parseSessionList("   \n  ", "/repo")).toEqual([]);
  });

  // Regression: `opencode session list --format json` intermittently emits a
  // truncated stream (Unexpected EOF) when opencode's DB is mid-write. The
  // parser throws loudly so indexSource's listSessions catch can degrade to
  // an empty index instead of crashing the run.
  test("throws on a truncated session-list stream (non-empty, cut off)", () => {
    const truncated = `[{"id":"ses_1","updated":1,"directory":"/repo"},{"id":"ses`;

    expect(() => parseSessionList(truncated, "/repo")).toThrow();
  });
});

describe("parseExportText", () => {
  test("extracts text parts from a real-shaped opencode export", () => {
    const raw = JSON.stringify({
      info: { id: "ses_1" },
      messages: [
        {
          info: { role: "user" },
          parts: [{ type: "text", text: "fixed the login bug" }],
        },
        {
          info: { role: "assistant" },
          parts: [{ type: "step-start" }, { type: "text", text: "done" }],
        },
      ],
    });

    expect(parseExportText(raw)).toBe("fixed the login bug\n\ndone");
  });

  // Stable-interface regression: this is the exact shape of risk the
  // opencode storage-format migration (files -> event-sourced SQLite)
  // represented — `export`'s own JSON contract breaking must fail loudly.
  test("throws when the response shape breaks (missing messages array)", () => {
    expect(() => parseExportText(JSON.stringify({ info: {} }))).toThrow(
      /unexpected shape/,
    );
  });

  test("skips a null message entry instead of throwing", () => {
    const raw = JSON.stringify({
      messages: [null, { parts: [{ type: "text", text: "ok" }] }],
    });

    expect(parseExportText(raw)).toBe("ok");
  });

  // Regression for the live y-memory bug: `opencode export` returns a
  // truncated JSON stream for some sessions (Unexpected EOF). parseExportText
  // must still throw loudly so indexSource's per-session catch can skip that
  // one session instead of silently dropping its content — the throw is the
  // signal the loop is designed around.
  test("throws on a truncated JSON stream (the real-world export failure)", () => {
    const truncated = `{"info":{"id":"ses_1"},"messages":[{"parts":[{"type":"text","text":"fixed the "`;

    expect(() => parseExportText(truncated)).toThrow();
  });
});
