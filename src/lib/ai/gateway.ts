import ZAI from "z-ai-web-dev-sdk";
import { getSettings, SETTING_KEYS, SettingKey } from "@/lib/settings";
import { log } from "@/lib/logger";

/**
 * AI Gateway
 * -----------
 * Architecture principle: the Application layer talks ONLY to this gateway.
 * It never imports the LLM SDK directly. The gateway resolves the active
 * provider from data-driven settings, so swapping GLM -> Qwen -> Llama ->
 * OpenAI-compatible later requires NO changes in the Project / Chat layers.
 *
 * Currently backed by the Z.AI SDK (GLM family), exposed through a clean,
 * provider-agnostic surface: chat() + chatStream().
 */

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  thinking?: "enabled" | "disabled";
  model?: string;
}

export interface ResolvedGatewayConfig {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  thinking: "enabled" | "disabled";
  maxContextMessages: number;
  usingSystemConfig: boolean;
}

/** Resolve effective config from DB settings, falling back to system config. */
export async function resolveConfig(): Promise<ResolvedGatewayConfig> {
  const s = await getSettings();
  const apiKey = s[SETTING_KEYS.apiKey]?.trim();
  const baseUrl = s[SETTING_KEYS.baseUrl]?.trim();
  return {
    provider: s[SETTING_KEYS.provider] || "glm",
    baseUrl,
    model: s[SETTING_KEYS.model] || "GLM-4.7-Flash",
    apiKey,
    temperature: parseFloat(s[SETTING_KEYS.temperature] || "0.6"),
    thinking: (s[SETTING_KEYS.thinking] as "enabled" | "disabled") || "disabled",
    maxContextMessages: parseInt(s[SETTING_KEYS.maxContextMessages] || "20", 10),
    usingSystemConfig: !apiKey,
  };
}

/**
 * Build a ZAI client. If an apiKey is configured in DB settings, use it
 * directly (data-driven). Otherwise fall back to the system config file
 * so the app works out-of-the-box in this environment.
 */
async function getClient(): Promise<{ client: ZAI; config: ResolvedGatewayConfig }> {
  const config = await resolveConfig();
  let client: ZAI;
  if (config.apiKey) {
    client = new ZAI({ baseUrl: config.baseUrl, apiKey: config.apiKey });
  } else {
    // Falls back to /etc/.z-ai-config (system-managed credentials)
    client = await ZAI.create();
  }
  return { client, config };
}

/** Non-streaming chat completion — returns the full assistant text. */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<{ content: string; model: string }> {
  const { client, config } = await getClient();
  const model = opts.model || config.model;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: opts.temperature ?? config.temperature,
      thinking: { type: opts.thinking || config.thinking },
      stream: false,
    });
    const content = completion?.choices?.[0]?.message?.content ?? "";
    await log("info", "gateway", "Chat completion OK", { model, messages: messages.length });
    return { content, model };
  } catch (e) {
    const err = e as Error;
    await log("error", "gateway", "Chat completion failed", {
      model,
      message: err.message,
    });
    throw err;
  }
}

/**
 * Streaming chat completion — yields text deltas as they arrive.
 * Parses the SSE stream returned by the SDK into plain text chunks.
 */
export async function* chatStream(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { client, config } = await getClient();
  const model = opts.model || config.model;

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = (await client.chat.completions.create({
      model,
      messages,
      temperature: opts.temperature ?? config.temperature,
      thinking: { type: opts.thinking || config.thinking },
      stream: true,
    })) as ReadableStream<Uint8Array>;
  } catch (e) {
    const err = e as Error;
    await log("error", "gateway", "Stream request failed", { model, message: err.message });
    throw err;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let yielded = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line || !line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta: string = json?.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            yielded++;
            yield delta;
          }
        } catch {
          // Partial/non-JSON line — ignore; SSE chunks can split across reads.
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
    await log("info", "gateway", "Stream completion done", { model, chunks: yielded });
  }
}

/** Convenience: validate the gateway connection with a tiny ping. */
export async function ping(): Promise<{ ok: boolean; model: string; error?: string }> {
  const config = await resolveConfig();
  try {
    const { content } = await chat(
      [{ role: "user", content: "Reply with the single word: ok" }],
      { temperature: 0 }
    );
    return { ok: !!content, model: config.model };
  } catch (e) {
    return { ok: false, model: config.model, error: (e as Error).message };
  }
}

export { SETTING_KEYS as AI_SETTING_KEYS };
export type { SettingKey };
