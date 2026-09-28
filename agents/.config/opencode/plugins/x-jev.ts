import { homedir } from "node:os"

const APPROVE_AT = Number(process.env.JEV_APPROVE_AT ?? 0.9)
const DECISIONS_URL = process.env.JEV_DECISIONS_URL ?? "https://openrouter.ai/api/alpha/decisions"
const FETCH_TIMEOUT_MS = 8_000
const JEV_MODEL = process.env.JEV_MODEL ?? "typesafe/jev-1.13"

type Choice_Question = { type: "choice"; instructions: string; criteria: Record<string, string> }
type Noul_Question = { type: "noul"; instructions: string }
type Score_Question = { type: "score"; instructions: string; criteria: string[] }
type Jev_Question = Choice_Question | Noul_Question | Score_Question

type Jev_Request = { state: unknown; questions: Record<string, Jev_Question> }

type Jev_Answer =
  | { type: "choice"; choice: string; confidence?: number; probabilities?: Record<string, number> }
  | { type: "noul"; noul: number }
  | { type: "score"; score: number; confidence?: number; probabilities?: Record<string, number> }

type Jev_Response = { answers?: Record<string, Jev_Answer>; usage?: { cost?: number; input_tokens?: number; output_tokens?: number } }

type Gate_State = { commands: string[]; project: string; task?: string }

type Opencode_Client = {
  postSessionIdPermissionsPermissionId(options: {
    body: { response: "once" }
    path: { id: string; permissionID: string }
  }): Promise<unknown>
  session: {
    messages(options: { path: { id: string } }): Promise<{
      data?: Array<{ info?: { role?: string }; parts?: Array<{ text?: string; type?: string }> }>
    }>
  }
}

type Opencode_Plugin_Input = { client: Opencode_Client; directory: string }

type Permission_Asked = {
  id: string
  metadata?: { command?: unknown }
  permission: string
  sessionID: string
}

type Claude_Hook_Input = {
  cwd: string
  tool_input?: { command?: unknown; description?: unknown }
  tool_name?: string
}

const RISKY = [
  /^(\S*['"\\=$]|[-0-9])/,
  /^(sudo|doas|su)\b/,
  /^(bash|sh|zsh|fish|eval|xargs)\b/,
  /^(node|bun|python3?)\s+(-\S+\s+)*(-c|-e|-p|--eval)\b/,
  /^rm\s+(-\S*[rRf]\S*\s+)+/,
  /^git\b.*\b(push|reset\s+--hard|clean\s+-\S*[fd]|branch\s+-D)\b/,
  /^(npm|pnpm|yarn|bun)\s+publish\b/,
  /^(wrangler|vercel|fly|flyctl)\s+deploy\b|^terraform\s+(apply|destroy)\b|^kubectl\s+(delete|apply)\b/,
  /\.env\b|\.ssh\b|\.aws\b|\.npmrc\b|\.netrc\b|credentials/i,
]

const GATE_QUESTIONS = {
  reversible: {
    type: "noul",
    instructions:
      "Every command in `commands` only reads or changes files inside `project` and can be undone with git or by rerunning it. It does not push, publish, deploy, delete files outside the project, change system settings, or send data to a network service.",
  },
  serves_task: {
    type: "noul",
    instructions: "Running `commands` is a reasonable next step toward `task`.",
  },
} as const satisfies Record<string, Noul_Question>

async function api_key(): Promise<string | undefined> {
  const from_env = process.env.OPENROUTER_API_KEY
  if (from_env) return from_env
  try {
    const auth = (await Bun.file(`${homedir()}/.local/share/opencode/auth.json`).json()) as {
      openrouter?: { key?: string }
    }
    return typeof auth.openrouter?.key === "string" ? auth.openrouter.key : undefined
  } catch {
    return undefined
  }
}

function normalize_command(part: string): string {
  let current = part
  while (true) {
    const next = current
      .trim()
      .replace(/^(if|then|elif|else|fi|while|until|do|done|for|in|case|esac|!)\s+/, "")
      .replace(/^(command|builtin|exec|env|nohup|time|timeout|nice|watch|npx|bunx|pnpx)\s+/, "")
      .replace(/^[A-Za-z_][A-Za-z0-9_]*=[^\s'"\\$]*\s+/, "")
      .replace(/^\\/, "")
      .replace(/^[^\s'"\\$]*\//, "")
    if (next === current) return current
    current = next
  }
}

function never_auto_approve(command: string): boolean {
  if (/\$\(|[<>]\(|`|\\\r?\n/.test(command)) return true
  return command
    .split(/\s*(?:&&|\|\||;|\||&|\n|[(){}])\s*/)
    .map(normalize_command)
    .some((part) => RISKY.some((pattern) => pattern.test(part)))
}

async function jev_decide(request: Jev_Request): Promise<Jev_Response | undefined> {
  const key = await api_key()
  if (!key) return undefined
  const res = await fetch(DECISIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: JEV_MODEL, ...request }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch(() => undefined)
  if (!res?.ok) return undefined
  return (await res.json().catch(() => undefined)) as Jev_Response | undefined
}

async function jev_approves(state: Gate_State): Promise<boolean | undefined> {
  const asked: Array<keyof typeof GATE_QUESTIONS> =
    state.task === undefined ? ["reversible"] : ["reversible", "serves_task"]
  const questions = Object.fromEntries(asked.map((key) => [key, GATE_QUESTIONS[key]]))
  const response = await jev_decide({ state, questions })
  if (!response?.answers) return undefined
  const scores = asked.map((key) => response.answers?.[key])
  const valid = scores.every(
    (answer): answer is { type: "noul"; noul: number } =>
      answer?.type === "noul" && typeof answer.noul === "number" && answer.noul >= 0 && answer.noul <= 1,
  )
  if (!valid) return undefined
  return scores.every((answer) => answer.noul >= APPROVE_AT)
}

function task_from_messages(
  list: Array<{ info?: { role?: string }; parts?: Array<{ text?: string; type?: string }> }> | undefined,
): string | undefined {
  const last_user = [...(list ?? [])].reverse().find((message) => message.info?.role === "user")
  const text = (last_user?.parts ?? [])
    .filter((part) => part?.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim()
  return text ? text.slice(0, 2_000) : undefined
}

export const Jev_Plugin = async (input: Opencode_Plugin_Input) => ({
  event: async ({ event }: { event: { properties?: unknown; type?: string } }): Promise<void> => {
    try {
      if (event.type !== "permission.asked") return
      const request = event.properties as Permission_Asked | undefined
      if (!request || request.permission !== "bash") return
      const command = typeof request.metadata?.command === "string" ? request.metadata.command : undefined
      if (!command || never_auto_approve(command)) return
      const messages = await input.client.session.messages({ path: { id: request.sessionID } }).catch(() => undefined)
      const task = task_from_messages(messages?.data)
      if ((await jev_approves({ commands: [command], project: input.directory, task })) !== true) return
      await input.client
        .postSessionIdPermissionsPermissionId({
          path: { id: request.sessionID, permissionID: request.id },
          body: { response: "once" },
        })
        .catch(() => undefined)
    } catch {
      return
    }
  },
})

export default Jev_Plugin

async function stdin_text(): Promise<string> {
  return await new Response(Bun.stdin.stream()).text()
}

async function main(): Promise<void> {
  const args = Bun.argv.slice(2)

  if (args[0] === "check") {
    const command = args.slice(1).join(" ")
    process.stdout.write(JSON.stringify({ auto_approvable: command.length > 0 && !never_auto_approve(command) }) + "\n")
    return
  }

  if (args[0] === "decide") {
    const request = JSON.parse(await stdin_text()) as Jev_Request
    const response = await jev_decide(request)
    if (!response) {
      process.stderr.write("jev request failed (missing key, network, or non-ok response)\n")
      process.exit(1)
    }
    process.stdout.write(JSON.stringify({ answers: response.answers ?? {}, usage: response.usage ?? {} }, null, 2) + "\n")
    return
  }

  const input = JSON.parse(await stdin_text()) as Claude_Hook_Input
  const command = input.tool_input?.command
  if (input.tool_name !== "Bash" || typeof command !== "string" || never_auto_approve(command)) return
  const description = input.tool_input?.description
  const task = typeof description === "string" && description.trim() ? description.slice(0, 2_000) : undefined
  if ((await jev_approves({ commands: [command], project: input.cwd, task })) !== true) return
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "allow" } } }) + "\n",
  )
}

if (import.meta.main) await main()