import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "claude_code_session_start.ts");

async function runHook(cwd: string, fakeHome: string): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", HOOK_PATH], {
    stdin: new Response(JSON.stringify({ cwd })),
    stdout: "pipe",
    stderr: "pipe",
    // Isolate from the real user's ~/.cache/agents/memory/index.md, which
    // this hook now injects when present — a hermetic fake HOME has none.
    env: { ...process.env, HOME: fakeHome },
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode };
}

describe("claude_code_session_start hook", () => {
  test("exits 0 with no output when there's nothing to report (no opencode, no sessions)", async () => {
    const project = mkdtempSync(join(tmpdir(), "x-memory-hook-"));
    try {
      const { stdout, exitCode } = await runHook(project, project);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe("");
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }, 10_000);

  test("injects global and project memory index.md content when present", async () => {
    const fakeHome = mkdtempSync(join(tmpdir(), "x-memory-hook-home-"));
    const project = mkdtempSync(join(tmpdir(), "x-memory-hook-project-"));
    try {
      mkdirSync(join(fakeHome, ".cache/agents/memory"), { recursive: true });
      writeFileSync(join(fakeHome, ".cache/agents/memory/index.md"), "global router page");
      mkdirSync(join(project, ".agents/memory"), { recursive: true });
      writeFileSync(join(project, ".agents/memory/index.md"), "project router page");

      const { stdout, exitCode } = await runHook(project, fakeHome);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.hookSpecificOutput.additionalContext).toContain("global router page");
      expect(parsed.hookSpecificOutput.additionalContext).toContain("project router page");
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
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
