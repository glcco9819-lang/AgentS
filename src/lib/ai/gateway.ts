import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { log } from "@/lib/logger";

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage { role: ChatRole; content: string; }
export interface ChatOptions {
  temperature?: number; thinking?: "enabled" | "disabled"; model?: string;
  providerId?: string; agentId?: string;
}
export interface ProviderInfo { id: string; name: string; baseUrl: string; apiKey?: string; enabled: boolean; defaultModel: string; }

export async function getProviders(): Promise<ProviderInfo[]> {
  const providers = await db.modelProvider.findMany({ orderBy: { name: "asc" } });
  return providers.map((p) => ({ id: p.id, name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey ?? undefined, enabled: p.enabled, defaultModel: p.name.includes("glm") ? "GLM-4.7-Flash" : "default" }));
}
export async function getProviderById(providerId: string): Promise<ProviderInfo | null> {
  const p = await db.modelProvider.findUnique({ where: { id: providerId } });
  if (!p) return null;
  return { id: p.id, name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey ?? undefined, enabled: p.enabled, defaultModel: p.name.includes("glm") ? "GLM-4.7-Flash" : "default" };
}
export async function getAgentProvider(agentId: string): Promise<ProviderInfo | null> {
  const binding = await db.agentModelBinding.findUnique({ where: { agentId } });
  if (!binding) return null;
  return getProviderById(binding.providerId);
}
export async function bindAgentToProvider(params: { agentId: string; providerId: string; modelName?: string; }): Promise<void> {
  await db.agentModelBinding.upsert({ where: { agentId: params.agentId }, update: { providerId: params.providerId, modelName: params.modelName ?? null }, create: { agentId: params.agentId, providerId: params.providerId, modelName: params.modelName ?? null } });
  await log("info", "gateway", "Agent bound to provider", params);
}
export async function unbindAgent(agentId: string): Promise<void> { await db.agentModelBinding.deleteMany({ where: { agentId } }); }

async function resolveRequestConfig(opts: ChatOptions) {
  if (opts.providerId) {
    const provider = await getProviderById(opts.providerId);
    if (provider?.enabled) return { provider: provider.name, model: opts.model || provider.defaultModel, temperature: 0.6, thinking: opts.thinking || "disabled" as const };
  }
  if (opts.agentId) {
    const binding = await db.agentModelBinding.findUnique({ where: { agentId: opts.agentId } });
    if (binding) {
      const provider = await getProviderById(binding.providerId);
      if (provider?.enabled) return { provider: provider.name, model: binding.modelName || opts.model || provider.defaultModel, temperature: 0.6, thinking: opts.thinking || "disabled" as const };
    }
  }
  const s = await getSettings();
  return { provider: s[SETTING_KEYS.provider] || "glm", model: opts.model || s[SETTING_KEYS.model] || "GLM-4.7-Flash", temperature: opts.temperature ?? parseFloat(s[SETTING_KEYS.temperature] || "0.6"), thinking: (opts.thinking || s[SETTING_KEYS.thinking] || "disabled") as "enabled" | "disabled" };
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<{ content: string; model: string }> {
  const config = await resolveRequestConfig(opts);
  const client = await ZAI.create();
  try {
    const completion = await client.chat.completions.create({ model: config.model, messages, temperature: config.temperature, thinking: { type: config.thinking }, stream: false });
    const content = completion?.choices?.[0]?.message?.content ?? "";
    await log("info", "gateway", "Chat OK", { model: config.model, provider: config.provider, agentId: opts.agentId ?? "default" });
    return { content, model: config.model };
  } catch (e) {
    await log("error", "gateway", "Chat failed", { model: config.model, message: (e as Error).message });
    throw e;
  }
}

export async function* chatStream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncGenerator<string, void, unknown> {
  const config = await resolveRequestConfig(opts);
  const client = await ZAI.create();
  const stream = (await client.chat.completions.create({ model: config.model, messages, temperature: config.temperature, thinking: { type: config.thinking }, stream: true })) as ReadableStream<Uint8Array>;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try { const json = JSON.parse(data); const delta = json?.choices?.[0]?.delta?.content ?? ""; if (delta) yield delta; } catch {}
      }
    }
  } finally { try { reader.releaseLock(); } catch {} }
}

export async function ping(): Promise<{ ok: boolean; model: string; error?: string }> {
  try { const { content } = await chat([{ role: "user", content: "Reply with: ok" }], { temperature: 0 }); return { ok: !!content, model: "GLM-4.7-Flash" }; }
  catch (e) { return { ok: false, model: "GLM-4.7-Flash", error: (e as Error).message }; }
}

export { SETTING_KEYS as AI_SETTING_KEYS };
