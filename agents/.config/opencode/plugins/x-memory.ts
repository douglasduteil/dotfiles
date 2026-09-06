// opencode auto-loads plugins only from this directory (no path-based
// config option exists), so this is a thin shim: the real implementation
// lives in x-memory/src/, loaded here via a runtime-computed path since
// a static relative import can't reach across the repo tree from a
// symlinked config directory.
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const pluginPath = pathToFileURL(`${homedir()}/.dotfiles/x-memory/src/hooks/opencode_session_plugin.ts`).href;
const { default: XMemoryPlugin } = await import(pluginPath);

export default XMemoryPlugin;
