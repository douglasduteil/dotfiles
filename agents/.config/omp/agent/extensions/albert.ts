type LoginCallbacks = { onPrompt(prompt: { message: string; secret?: boolean }): Promise<string> };

const base_url = "https://albert.api.etalab.gouv.fr/v1";
const chat_types: Record<string, true> = { "image-text-to-text": true, "text-generation": true };
const image_input: Record<string, true> = {
  "gemma-4-31b-it": true,
  "ministral-3-8b-instruct-2512": true,
  "mistral-medium-3-5": true,
  "mistral-small-3-2-24b-instruct-2506": true,
};
const max_output = 32768;
const reasoning: Record<string, true> = { "gpt-oss-120b": true };

const cost_field = (costs: unknown, key: "completion_tokens" | "prompt_tokens") => {
  const value: unknown = typeof costs === "object" && costs !== null ? Reflect.get(costs, key) : undefined;
  return typeof value === "number" ? value : 0;
};

const albert_model = (id: string, context_window: number, costs: unknown) => ({
  compat: id.startsWith("deepseek-v4-flash") ? { extraBody: { tool_choice: "auto" } } : undefined,
  contextWindow: context_window,
  cost: { cacheRead: 0, cacheWrite: 0, input: cost_field(costs, "prompt_tokens"), output: cost_field(costs, "completion_tokens") },
  id,
  input: image_input[id] ? ["text", "image"] : ["text"],
  maxTokens: Math.min(max_output, context_window),
  name: `Albert · ${id}`,
  reasoning: reasoning[id] === true,
});

const chat_models = (body: unknown) => {
  const data = typeof body === "object" && body !== null && "data" in body ? body.data : undefined;
  if (!Array.isArray(data)) throw new Error("albert: GET /v1/models returned no data array");
  return data.flatMap((row: unknown) => {
    if (typeof row !== "object" || row === null || !("id" in row) || !("type" in row)) return [];
    if (typeof row.id !== "string" || typeof row.type !== "string" || !chat_types[row.type]) return [];
    const context = "max_context_length" in row && typeof row.max_context_length === "number" ? row.max_context_length : 131072;
    return [albert_model(row.id, context, "costs" in row ? row.costs : undefined)];
  });
};

const fetch_models = async (api_key: string | undefined) => {
  if (!api_key) return [];
  const response = await fetch(`${base_url}/models`, { headers: { Authorization: `Bearer ${api_key}` } });
  if (!response.ok) throw new Error(`albert: GET /v1/models failed with HTTP ${response.status}`);
  const body: unknown = await response.json();
  return chat_models(body);
};

const albert = {
  api: "openai-completions",
  baseUrl: base_url,
  compat: { maxTokensField: "max_tokens", supportsDeveloperRole: false },
  fetchDynamicModels: fetch_models,
  oauth: {
    login: (callbacks: LoginCallbacks) => callbacks.onPrompt({ message: "Albert API key", secret: true }),
    name: "Albert API (DINUM)",
  },
};

export default function albert_provider(pi: { registerProvider(name: string, config: typeof albert): void }): void {
  pi.registerProvider("albert", albert);
}
