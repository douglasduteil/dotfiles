#!/usr/bin/env bun
import { indexClaudeCode, indexOpencode } from "./index_action";
import { pinEntry, rejectEntry } from "./mutate_action";
import { resolveProjectRoot } from "./project";
import { queryProject } from "./query_action";
import type { Scope } from "./reducer";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}

function has(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const project = await resolveProjectRoot(
    flag(args, "project") ?? process.cwd(),
  );

  switch (command) {
    case "index": {
      const tool = flag(args, "tool") ?? "claude-code";
      const indexFn =
        tool === "claude-code"
          ? indexClaudeCode
          : tool === "opencode"
            ? indexOpencode
            : undefined;
      if (!indexFn) {
        console.error(
          `Unsupported --tool "${tool}" (expected "claude-code" or "opencode")`,
        );
        process.exit(1);
      }
      const result = await indexFn(project, {
        rebuild: has(args, "rebuild"),
        scope: flag(args, "scope") as Scope | undefined,
      });
      console.log(`Indexed ${result.indexed} session(s) for ${project}`);
      break;
    }
    case "query": {
      const results = queryProject(project, {
        searchTerm: flag(args, "search"),
        scope: flag(args, "scope") as Scope | undefined,
      });
      if (results.length === 0) {
        console.log("No recap found.");
        break;
      }
      for (const { entry, stale } of results) {
        const staleTag = stale ? " [stale]" : "";
        console.log(
          `- ${entry.id} (${entry.sourceTool}, ${new Date(entry.sessionModifiedAt).toISOString()})${staleTag}`,
        );
        console.log(entry.extractedText.slice(0, 500));
      }
      break;
    }
    case "reject":
    case "pin": {
      const entryId = args[0];
      if (!entryId) {
        console.error(
          `Usage: x-memory ${command} <entry_id> [--scope project|global] [--project <dir>]`,
        );
        process.exit(1);
      }
      const scope = (flag(args, "scope") as Scope | undefined) ?? "project";
      const found = (command === "reject" ? rejectEntry : pinEntry)(
        project,
        entryId,
        scope,
      );
      console.log(
        found
          ? `${command === "reject" ? "Rejected" : "Pinned"} ${entryId} (${scope} scope)`
          : `No entry found for ${entryId} in ${scope} scope`,
      );
      if (!found) process.exit(1);
      break;
    }
    default:
      console.error(
        "Usage: x-memory <index|query|reject|pin> --project <dir> [--tool claude-code|opencode] [--rebuild] [--search <term>] [--scope project|global]",
      );
      process.exit(1);
  }
}

main();
