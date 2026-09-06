import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const listSessionsMock = mock();
const getSessionMessagesMock = mock();

mock.module("@anthropic-ai/claude-agent-sdk", () => ({
  listSessions: listSessionsMock,
  getSessionMessages: getSessionMessagesMock,
}));

const { indexClaudeCode } = await import("./index_action");

function listAllFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
}

let workDir: string;

afterEach(() => {
  listSessionsMock.mockReset();
  getSessionMessagesMock.mockReset();
  if (workDir) rmSync(workDir, { recursive: true, force: true });
});

describe("scope constraint", () => {
  test("index() reads only the requested project directory, never an unrequested sibling", async () => {
    workDir = mkdtempSync(join(tmpdir(), "x-memory-scope-"));
    const projectA = join(workDir, "project-a");
    const projectB = join(workDir, "project-b");
    mkdirSync(projectA, { recursive: true });
    mkdirSync(projectB, { recursive: true });

    listSessionsMock.mockResolvedValue([{ sessionId: "s1", lastModified: 1000 }]);
    getSessionMessagesMock.mockResolvedValue([{ message: { role: "user", content: "work in A" } }]);

    await indexClaudeCode(projectA);

    expect(listSessionsMock).toHaveBeenCalledWith({ dir: projectA, includeWorktrees: false });
    expect(listSessionsMock).not.toHaveBeenCalledWith(expect.objectContaining({ dir: projectB }));
    expect(getSessionMessagesMock).toHaveBeenCalledWith("s1", { dir: projectA });
  });

  test("index() writes only under <project>/.agents/x-memory, nothing outside the target directory", async () => {
    workDir = mkdtempSync(join(tmpdir(), "x-memory-scope-"));
    const project = join(workDir, "project-a");
    mkdirSync(project, { recursive: true });

    listSessionsMock.mockResolvedValue([{ sessionId: "s1", lastModified: 1000 }]);
    getSessionMessagesMock.mockResolvedValue([{ message: { role: "user", content: "hello" } }]);

    await indexClaudeCode(project);

    const filesWritten = listAllFiles(workDir).map((f) => f.slice(workDir.length + 1));
    for (const file of filesWritten) {
      expect(file.startsWith(join("project-a", ".agents", "x-memory"))).toBe(true);
    }
    expect(filesWritten.length).toBeGreaterThan(0);
  });
});
