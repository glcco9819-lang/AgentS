import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Prompt Manager — system / analysis prompts are data-driven and multi-language.
 * Hard-coded prompts are avoided so prompts can evolve without code changes.
 */

export type PromptKey =
  | "system"
  | "codeReview"
  | "architecture"
  | "sqlAnalysis"
  | "documentation"
  | "bugAnalysis";

export interface PromptSeed {
  key: PromptKey;
  name: string;
  language: "fa" | "en";
  content: string;
}

export const DEFAULT_PROMPTS: PromptSeed[] = [
  {
    key: "system",
    name: "پرامپت پایه دستیار پروژه",
    language: "fa",
    content:
      "تو یک دستیار مهندسی هوش مصنوعی محلی برای تحلیل پروژه‌های نرم‌افزاری هستی. " +
      "تو با دقت، حرفه‌ای و دقیق پاسخ می‌دهی. هنگام بررسی کد، ابتدا ساختار را درک کن، " +
      "سپس راه‌حل‌های عملی و روشن ارائه بده. اگر اطلاعات کافی نداری، صریح بپرس. " +
      "پاسخ‌ها را با فرمت Markdown و در صورت نیاز بلوک کد ارائه بده.",
  },
  {
    key: "system",
    name: "Base Project Assistant Prompt",
    language: "en",
    content:
      "You are a local AI engineering assistant for analyzing software projects. " +
      "Be precise, professional, and thorough. When reviewing code, first understand the " +
      "structure, then provide practical, clear solutions. Ask clarifying questions when " +
      "information is insufficient. Respond in Markdown with code blocks where appropriate.",
  },
  {
    key: "codeReview",
    name: "بازبینی کد",
    language: "fa",
    content:
      "به‌عنوان یک مرورگر کد ارشد، کد ارائه‌شده را بررسی کن. این موارد را شناسایی کن: " +
      "باگ‌ها، مشکلات امنیتی، مشکلات کارایی، کد تکراری و نقض اصول معماری. " +
      "برای هر مسئله، شدت (بحرانی/بالا/متوسط/پایین) و یک پیشنهاد اصلاح کوتاه ارائه بده.",
  },
  {
    key: "architecture",
    name: "بازبینی معماری",
    language: "fa",
    content:
      "معماری پروژه را تحلیل کن: لایه‌ها، وابستگی‌ها، جداسازی مسئولیت‌ها و نقاط اتصال. " +
      "نقاط قوت و نقاط ضعف را فهرست کن و پیشنهادهای بهبود معماری ارائه بده.",
  },
  {
    key: "sqlAnalysis",
    name: "تحلیل SQL",
    language: "fa",
    content:
      "ساختار پایگاه داده را تحلیل کن: جداول، کلیدهای اصلی/خارجی، ایندکس‌ها و Viewها. " +
      "مشکلات نرمال‌سازی، ایندکس‌گذاری و عملکرد را شناسایی کن و راه‌حل ارائه بده.",
  },
  {
    key: "documentation",
    name: "تولید مستندات",
    language: "fa",
    content:
      "برای کد/ماژول ارائه‌شده مستندات فنی تمیز تولید کن: خلاصه، ورودی/خروجی، نکات طراحی و مثال استفاده.",
  },
  {
    key: "bugAnalysis",
    name: "تحلیل باگ",
    language: "fa",
    content:
      "باگ گزارش‌شده را تحلیل کن. احتمالاً ریشه مشکل را در کد پیدا کن، " +
      "دلیل ریشه‌ای را توضیح بده و یک راه‌حل گام‌به‌گام ارائه کن.",
  },
];

export async function getPrompt(key: PromptKey, language: "fa" | "en" = "fa"): Promise<string> {
  const row = await db.prompt.findUnique({ where: { key_language: { key, language } } });
  return (
    row?.content ??
    DEFAULT_PROMPTS.find((p) => p.key === key && p.language === language)?.content ??
    ""
  );
}

export async function listPrompts(language?: "fa" | "en") {
  return db.prompt.findMany({
    where: language ? { language } : undefined,
    orderBy: [{ language: "asc" }, { key: "asc" }],
  });
}

export async function upsertPrompt(data: {
  key: PromptKey;
  name: string;
  content: string;
  language: "fa" | "en";
  isDefault?: boolean;
}) {
  const created = await db.prompt.upsert({
    where: { key_language: { key: data.key, language: data.language } },
    update: { name: data.name, content: data.content, isDefault: data.isDefault ?? false },
    create: {
      key: data.key,
      name: data.name,
      content: data.content,
      language: data.language,
      isDefault: data.isDefault ?? false,
    },
  });
  await log("info", "prompt", `Prompt updated: ${data.key} (${data.language})`);
  return created;
}

/** Seed default prompts into DB if missing (idempotent). */
export async function ensureDefaultPrompts(): Promise<void> {
  for (const seed of DEFAULT_PROMPTS) {
    const existing = await db.prompt.findUnique({
      where: { key_language: { key: seed.key, language: seed.language } },
    });
    if (!existing) {
      await db.prompt.create({
        data: {
          key: seed.key,
          name: seed.name,
          content: seed.content,
          language: seed.language,
          isDefault: seed.key === "system",
        },
      });
    }
  }
}
