import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "claude_code_session_start.ts");

async function runHook(cwd: string): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", HOOK_PATH], {
    stdin: new Response(JSON.stringify({ cwd })),
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode };
}

describe("claude_code_session_start hook", () => {
  test("exits 0 with no output when there's nothing to report (no opencode, no sessions)", async () => {
    const project = mkdtempSync(join(tmpdir(), "x-memory-hook-"));
    try {
      const { stdout, exitCode } = await runHook(project);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe("");
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }, 10_000);

  test("never throws or exits non-zero on malformed stdin", async () => {
    const proc = Bun.spawn(["bun", HOOK_PATH], {
      stdin: new Response("not json"),
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  }, 10_000);
});
