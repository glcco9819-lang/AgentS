import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Settings store — key/value pairs for AI Gateway configuration.
 * Architecture principle: the AI Gateway config is data-driven, not hard-coded,
 * so providers/models can be swapped without code changes.
 */

export const SETTING_KEYS = {
  provider: "provider", // glm | openai-compatible
  baseUrl: "baseUrl",
  model: "model",
  apiKey: "apiKey",
  temperature: "temperature",
  thinking: "thinking", // enabled | disabled
  maxContextMessages: "maxContextMessages",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  provider: "glm",
  baseUrl: "https://api.z.ai/api/paas/v4",
  model: "GLM-4.7-Flash",
  apiKey: "",
  temperature: "0.6",
  thinking: "disabled",
  maxContextMessages: "20",
};

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await db.aiSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key];
}

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await db.aiSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...(Object.fromEntries(map) as Record<string, string>) } as Record<
    SettingKey,
    string
  >;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await db.aiSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await log("info", "settings", `Setting updated: ${key}`);
}

export async function setSettings(values: Partial<Record<SettingKey, string>>): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    await db.aiSetting.upsert({
      where: { key: key as string },
      update: { value },
      create: { key: key as string, value },
    });
  }
  await log("info", "settings", "Settings batch updated", { keys: Object.keys(values) });
}

/** Ensure defaults exist in DB (used on first boot / seed). */
export async function ensureDefaultSettings(): Promise<void> {
  const existing = await db.aiSetting.findMany();
  const have = new Set(existing.map((r) => r.key));
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!have.has(key)) {
      await db.aiSetting.create({ data: { key, value } });
    }
  }
}
