import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Task Templates — predefined starting points for common tasks.
 * 12 templates across categories: design, implement, test, review, deploy, ops.
 */

export interface TaskTemplateSeed {
  name: string;
  category: string;
  description: string;
  instruction: string;
  agentType: string;
  taskType: string;
  verificationType: string;
  approvalGate?: string;
  expectedOutput?: string;
  icon?: string;
}

export const DEFAULT_TEMPLATES: TaskTemplateSeed[] = [
  {
    name: "تحلیل نیازمندی محصول",
    category: "design",
    description: "تحلیل و اولویت‌بندی نیازمندی‌های محصول",
    instruction: "نیازمندی‌های زیر را تحلیل کرده و کاربرهای MoSCoW را استخراج کن.",
    agentType: "product-manager",
    taskType: "requirement-analysis",
    verificationType: "code-review",
    expectedOutput: "سند نیازمندی‌ها",
    icon: "ClipboardList",
  },
  {
    name: "طراحی معماری",
    category: "design",
    description: "طراحی لایه‌بندی و وابستگی‌های معماری",
    instruction: "معماری سیستم را با لایه‌ها، وابستگی‌ها و نکات فنی طراحی کن.",
    agentType: "architect",
    taskType: "architecture-design",
    verificationType: "code-review",
    expectedOutput: "سند معماری",
    icon: "Network",
  },
  {
    name: "پیاده‌سازی بک‌اند",
    category: "implement",
    description: "تولید کد سمت سرور با تست",
    instruction: "کد بک‌اند را با ساختار تمیز، تست‌های واحد و مدیریت خطا تولید کن.",
    agentType: "backend-engineer",
    taskType: "implementation",
    verificationType: "unit-test",
    approvalGate: "code-review",
    expectedOutput: "سورس کد",
    icon: "Server",
  },
  {
    name: "پیاده‌سازی فرانت‌اند",
    category: "implement",
    description: "تولید کامپوننت‌های رابط کاربری",
    instruction: "کامپوننت‌های React را با TypeScript و Tailwind تولید کن.",
    agentType: "frontend-engineer",
    taskType: "implementation",
    verificationType: "unit-test",
    approvalGate: "code-review",
    expectedOutput: "کامپوننت‌ها",
    icon: "Monitor",
  },
  {
    name: "طراحی API",
    category: "design",
    description: "طراحی REST/gRPC و نقشه مسیرها",
    instruction: "API را با OpenAPI، نسخه‌بندی و امنیت طراحی کن.",
    agentType: "api-designer",
    taskType: "architecture-design",
    verificationType: "code-review",
    expectedOutput: "OpenAPI spec",
    icon: "Plug",
  },
  {
    name: "تولید تست",
    category: "test",
    description: "تولید تست‌های واحد و یکپارچه",
    instruction: "تست‌های واحد و یکپارچه با پوشش بالا برای کد داده‌شده تولید کن.",
    agentType: "qa-engineer",
    taskType: "test-generation",
    verificationType: "coverage",
    expectedOutput: "تست‌ها",
    icon: "TestTube2",
  },
  {
    name: "حسابرسی امنیتی",
    category: "review",
    description: "بررسی آسیب‌پذیری‌ها و ریسک‌ها",
    instruction: "حسابرسی امنیتی کامل انجام بده و یافته‌ها را با شدت گزارش کن.",
    agentType: "security-engineer",
    taskType: "security-audit",
    verificationType: "security-scan",
    approvalGate: "approval",
    expectedOutput: "گزارش امنیتی",
    icon: "ShieldCheck",
  },
  {
    name: "مرور کد",
    category: "review",
    description: "بازبینی کد برای کیفیت و باگ",
    instruction: "کد را برای باگ‌ها، امنیت، کارایی و خوانایی بازبینی کن.",
    agentType: "code-reviewer",
    taskType: "code-review",
    verificationType: "code-review",
    expectedOutput: "گزارش بازبینی",
    icon: "Eye",
  },
  {
    name: "مستندسازی",
    category: "review",
    description: "تولید مستندات فنی",
    instruction: "مستندات فنی شامل راهنما، API و نمونه‌ها را تولید کن.",
    agentType: "doc-writer",
    taskType: "documentation",
    verificationType: "code-review",
    expectedOutput: "مستندات",
    icon: "FileText",
  },
  {
    name: "تحلیل کارایی",
    category: "review",
    description: "شناسایی گلوگاه‌های کارایی",
    instruction: "تحلیل کارایی انجام بده و نقاط بهبود را فهرست کن.",
    agentType: "performance-engineer",
    taskType: "performance-analysis",
    verificationType: "code-review",
    expectedOutput: "گزارش کارایی",
    icon: "Gauge",
  },
  {
    name: "آماده‌سازی انتشار",
    category: "deploy",
    description: "بسته‌بندی و انتشار نسخه",
    instruction: "نسخه را برای انتشار آماده کن: changelog، evidence، و gate checks.",
    agentType: "release-engineer",
    taskType: "release-prep",
    verificationType: "build",
    approvalGate: "approval",
    expectedOutput: "نسخه انتشار",
    icon: "PackageCheck",
  },
  {
    name: "تحلیل باگ",
    category: "ops",
    description: "تحلیل ریشه‌ای باگ و راه‌حل",
    instruction: "باگ را تحلیل کرده، ریشه را پیدا کن و راه‌حل گام‌به‌گام پیشنهاد بده.",
    agentType: "code-reviewer",
    taskType: "bug-analysis",
    verificationType: "unit-test",
    expectedOutput: "گزارش باگ",
    icon: "Bug",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  design: "طراحی",
  implement: "پیاده‌سازی",
  test: "تست",
  review: "بازبینی",
  deploy: "استقرار",
  ops: "عملیات",
};

export const CATEGORY_COLORS: Record<string, string> = {
  design: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  implement: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  test: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  review: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  deploy: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  ops: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
};

export async function ensureDefaultTemplates(): Promise<void> {
  for (const t of DEFAULT_TEMPLATES) {
    const existing = await db.taskTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await db.taskTemplate.create({
        data: {
          name: t.name,
          category: t.category,
          description: t.description,
          instruction: t.instruction,
          agentType: t.agentType,
          taskType: t.taskType,
          verificationType: t.verificationType,
          approvalGate: t.approvalGate ?? null,
          expectedOutput: t.expectedOutput ?? null,
          icon: t.icon ?? null,
          isCustom: false,
        },
      });
    }
  }
  await log("info", "system", `Default templates ensured (${DEFAULT_TEMPLATES.length})`);
}

export async function listTemplates(category?: string) {
  return db.taskTemplate.findMany({
    where: category ? { category } : undefined,
    orderBy: { name: "asc" },
  });
}
