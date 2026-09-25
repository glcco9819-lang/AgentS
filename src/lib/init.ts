import { ensureDefaultSettings } from "@/lib/settings";
import { ensureDefaultPrompts } from "@/lib/ai/prompts";
import { ensureDefaultUsers } from "@/lib/auth";
import { log } from "@/lib/logger";
import { db } from "@/lib/db";

const DEFAULT_AGENTS = [
  { name: "Product Manager", domain: "product", type: "product-manager" },
  { name: "Business Analyst", domain: "product", type: "business-analyst" },
  { name: "Solution Architect", domain: "architecture", type: "architect" },
  { name: "Database Architect", domain: "data", type: "db-architect" },
  { name: "Database Developer", domain: "data", type: "db-dev" },
  { name: "Backend Developer", domain: "engineering", type: "backend-dev" },
  { name: "Frontend Developer", domain: "engineering", type: "frontend-dev" },
  { name: "Integration Agent", domain: "engineering", type: "integrator" },
  { name: "Security Agent", domain: "verification", type: "security" },
  { name: "UX/UI Design Agent", domain: "product", type: "ux-ui-design" },
  { name: "QA Agent", domain: "verification", type: "qa" },
  { name: "Test Engineering Agent", domain: "engineering", type: "test-engineer" },
  { name: "Code Review Agent", domain: "verification", type: "code-review" },
  { name: "Supply Chain Agent", domain: "engineering", type: "supply-chain" },
  { name: "Performance Agent", domain: "verification", type: "performance" },
  { name: "Bug Hunter Agent", domain: "verification", type: "bug-hunter" },
  { name: "Documentation Agent", domain: "product", type: "documentation" },
  { name: "Catalog Agent", domain: "product", type: "catalog" },
  { name: "Training Agent", domain: "product", type: "training" },
  { name: "DevOps Agent", domain: "engineering", type: "devops" },
  { name: "Monitoring Agent", domain: "verification", type: "monitoring" },
  { name: "SRE / Recovery Agent", domain: "verification", type: "sre-recovery" },
  { name: "Release Manager Agent", domain: "engineering", type: "release-manager" },
  { name: "Knowledge Curator Agent", domain: "product", type: "knowledge-curator" },
  { name: "Governance / Policy Agent", domain: "verification", type: "governance" },
  { name: "Platform Architecture Agent", domain: "architecture", type: "platform-architect" },
];

const DEFAULT_PROVIDERS = [
  { name: "AI1 (GLM-4.7-Flash)", baseUrl: "https://api.z.ai/api/paas/v4", defaultModel: "GLM-4.7-Flash" },
  { name: "AI2 (GLM-4-Plus)", baseUrl: "https://api.z.ai/api/paas/v4", defaultModel: "glm-4-plus" },
  { name: "AI3 (GLM-4-Flash)", baseUrl: "https://api.z.ai/api/paas/v4", defaultModel: "glm-4-flash" },
  { name: "AI4 (GLM-4-Air)", baseUrl: "https://api.z.ai/api/paas/v4", defaultModel: "glm-4-air" },
  { name: "AI5 (GLM-4-AirX)", baseUrl: "https://api.z.ai/api/paas/v4", defaultModel: "glm-4-airx" },
];

const DEFAULT_TEMPLATES = [
  { name: "تعریف چشم‌انداز محصول", category: "requirement", description: "تعریف اهداف و بازار هدف", instruction: "چشم‌انداز محصول را تعریف کن", agentType: "product-manager", taskType: "requirement", verificationType: "requirement", approvalGate: "product-scope", icon: "Lightbulb" },
  { name: "تحلیل نیازمندی‌های کسب‌وکار", category: "requirement", description: "استخراج use case‌ها", instruction: "نیازمندی‌های کسب‌وکار را تحلیل کن", agentType: "business-analyst", taskType: "requirement", verificationType: "requirement", icon: "ClipboardList" },
  { name: "طراحی معماری سیستم", category: "design", description: "طراحی لایه‌ها و سرویس‌ها", instruction: "معماری سیستم را طراحی کن", agentType: "architect", taskType: "design", verificationType: "architecture", approvalGate: "architecture", icon: "Network" },
  { name: "طراحی ERD پایگاه داده", category: "database", description: "طراحی جداول و روابط", instruction: "ERD پایگاه داده را طراحی کن", agentType: "db-architect", taskType: "sql", verificationType: "database", icon: "Database" },
  { name: "پیاده‌سازی سرویس Backend", category: "code", description: "کدنویسی سرویس‌ها", instruction: "سرویس Backend را پیاده‌سازی کن", agentType: "backend-dev", taskType: "code", verificationType: "code", icon: "Server" },
  { name: "پیاده‌سازی کامپوننت Frontend", category: "code", description: "ساخت کامپوننت React", instruction: "کامپوننت React را پیاده‌سازی کن", agentType: "frontend-dev", taskType: "code", verificationType: "ui", icon: "Monitor" },
  { name: "نوشتن Migration دیتابیس", category: "database", description: "ایجاد اسکریپت migration", instruction: "Migration SQL بنویس", agentType: "db-dev", taskType: "sql", verificationType: "database", approvalGate: "db-change", icon: "FileCode2" },
  { name: "بررسی یکپارچه‌سازی", category: "integration", description: "نقاط اتصال ماژول‌ها", instruction: "نقاط یکپارچه‌سازی را بررسی کن", agentType: "integrator", taskType: "code", verificationType: "api", icon: "Puzzle" },
  { name: "حسابرسی امنیتی", category: "security", description: "بررسی آسیب‌پذیری‌ها", instruction: "حسابرسی امنیتی انجام بده", agentType: "security", taskType: "document", verificationType: "security", approvalGate: "security", icon: "ShieldCheck" },
  { name: "تولید مستندات API", category: "documentation", description: "مستندات فنی", instruction: "مستندات API تولید کن", agentType: "documentation", taskType: "document", verificationType: "documentation", icon: "FileText" },
  { name: "بازبینی کد", category: "code", description: "بررسی کیفیت کد", instruction: "کد را بازبینی کن", agentType: "code-review", taskType: "code", verificationType: "code", icon: "ScanSearch" },
  { name: "نوشتن تست‌های واحد", category: "testing", description: "unit test", instruction: "تست‌های واحد بنویس", agentType: "test-engineer", taskType: "test", verificationType: "code", icon: "TestTube2" },
];

const DEFAULT_POLICIES = [
  { name: "no-self-verification", rule: "Producer agent cannot verify its own artifact", scope: "global" },
  { name: "max-rework-attempts", rule: "Tasks escalate to human after 3 failed attempts", scope: "global" },
  { name: "human-approval-required", rule: "Architecture, DB change, security, release need human approval", scope: "global" },
  { name: "full-traceability", rule: "Every artifact must be trace-linked to its source", scope: "global" },
];

async function ensureDefaults() {
  await ensureDefaultSettings();
  await ensureDefaultPrompts();
  await ensureDefaultUsers();
  for (const a of DEFAULT_AGENTS) { const e = await db.agent.findUnique({ where: { name: a.name } }); if (!e) await db.agent.create({ data: { ...a, version: "1.0.0", enabled: true } }); }
  const pc = await db.modelProvider.count(); if (pc === 0) for (const p of DEFAULT_PROVIDERS) await db.modelProvider.create({ data: { name: p.name, baseUrl: p.baseUrl, enabled: true } });
  const tc = await db.taskTemplate.count(); if (tc === 0) for (const t of DEFAULT_TEMPLATES) await db.taskTemplate.create({ data: { ...t, isCustom: false } });
  const plc = await db.policy.count(); if (plc === 0) for (const p of DEFAULT_POLICIES) await db.policy.create({ data: { ...p, enabled: true } });
  // Seed agent→provider bindings
  const bc = await db.agentModelBinding.count();
  if (bc === 0) {
    const agents = await db.agent.findMany({ orderBy: { name: "asc" }, take: 11 });
    const providers = await db.modelProvider.findMany({ orderBy: { name: "asc" } });
    if (agents.length >= 11 && providers.length >= 5) {
      const mapping = [{a:0,p:3},{a:1,p:3},{a:2,p:2},{a:3,p:1},{a:4,p:0},{a:5,p:2},{a:6,p:0},{a:7,p:4},{a:8,p:1},{a:9,p:2},{a:10,p:3}];
      for (const m of mapping) await db.agentModelBinding.create({ data: { agentId: agents[m.a].id, providerId: providers[m.p].id, modelName: DEFAULT_PROVIDERS[m.p].defaultModel } });
    }
  }
}

let seedPromise: Promise<void> | null = null;
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try { await ensureDefaults(); } catch (e) { seedPromise = null; await log("error", "system", "Seed failed", { message: (e as Error).message }); throw e; }
    })();
  }
  return seedPromise;
}
