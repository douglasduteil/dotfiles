import type { SourceTool } from "./reducer";

export function makeEntryId(sourceTool: SourceTool, sourceSessionId: string): string {
  return `${sourceTool}:${sourceSessionId}`;
}

export interface EntryIdRef {
  sourceTool: SourceTool;
  sourceSessionId: string;
}

export function parseEntryId(id: string): EntryIdRef {
  const separator = id.indexOf(":");
  if (separator === -1) {
    throw new Error(`Invalid entry id "${id}" (expected "<source-tool>:<session-id>")`);
  }
  const sourceTool = id.slice(0, separator);
  const sourceSessionId = id.slice(separator + 1);
  if (sourceTool !== "claude-code" && sourceTool !== "opencode") {
    throw new Error(`Invalid entry id "${id}": unknown source tool "${sourceTool}"`);
  }
  if (!sourceSessionId) {
    throw new Error(`Invalid entry id "${id}": missing session id`);
  }
  return { sourceTool, sourceSessionId };
}
