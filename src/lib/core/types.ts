/**
 * Core domain types — shared across orchestrator, agents, verification, etc.
 */

// 27 concrete agent types
export type AgentType =
  | "product-manager"
  | "architect"
  | "ux-designer"
  | "frontend-engineer"
  | "backend-engineer"
  | "database-engineer"
  | "devops-engineer"
  | "qa-engineer"
  | "security-engineer"
  | "code-reviewer"
  | "doc-writer"
  | "api-designer"
  | "test-architect"
  | "release-engineer"
  | "sre-engineer"
  | "data-scientist"
  | "ml-engineer"
  | "integration-engineer"
  | "mobile-engineer"
  | "platform-engineer"
  | "performance-engineer"
  | "accessibility-engineer"
  | "i18n-engineer"
  | "tech-writer"
  | "scrum-master"
  | "compliance-officer"
  | "incident-responder";

export const AGENT_TYPES: AgentType[] = [
  "product-manager",
  "architect",
  "ux-designer",
  "frontend-engineer",
  "backend-engineer",
  "database-engineer",
  "devops-engineer",
  "qa-engineer",
  "security-engineer",
  "code-reviewer",
  "doc-writer",
  "api-designer",
  "test-architect",
  "release-engineer",
  "sre-engineer",
  "data-scientist",
  "ml-engineer",
  "integration-engineer",
  "mobile-engineer",
  "platform-engineer",
  "performance-engineer",
  "accessibility-engineer",
  "i18n-engineer",
  "tech-writer",
  "scrum-master",
  "compliance-officer",
  "incident-responder",
];

export const AGENT_LABELS: Record<AgentType, string> = {
  "product-manager": "مدیر محصول",
  "architect": "معمار نرم‌افزار",
  "ux-designer": "طراح تجربه کاربری",
  "frontend-engineer": "مهندس فرانت‌اند",
  "backend-engineer": "مهندس بک‌اند",
  "database-engineer": "مهندس پایگاه داده",
  "devops-engineer": "مهندس دواپس",
  "qa-engineer": "مهندس تضمین کیفیت",
  "security-engineer": "مهندس امنیت",
  "code-reviewer": "مرورگر کد",
  "doc-writer": "نویسنده مستندات",
  "api-designer": "طراح API",
  "test-architect": "معمار تست",
  "release-engineer": "مهندس انتشار",
  "sre-engineer": "مهندس قابلیت اطمینان",
  "data-scientist": "دانمند داده",
  "ml-engineer": "مهندس یادگیری ماشین",
  "integration-engineer": "مهندس یکپارچه‌سازی",
  "mobile-engineer": "مهندس موبایل",
  "platform-engineer": "مهندس پلتفرم",
  "performance-engineer": "مهندس کارایی",
  "accessibility-engineer": "مهندس دسترس‌پذیری",
  "i18n-engineer": "مهندس بومی‌سازی",
  "tech-writer": "نویسنده فنی",
  "scrum-master": "اسکرام مستر",
  "compliance-officer": "مسئول انطباق",
  "incident-responder": "پاسخ‌دهنده حادثه",
};

export type TaskType =
  | "requirement-analysis"
  | "architecture-design"
  | "ui-design"
  | "implementation"
  | "code-review"
  | "test-generation"
  | "documentation"
  | "deployment"
  | "bug-analysis"
  | "security-audit"
  | "performance-analysis"
  | "release-prep"
  | "custom";

export type TaskStatus =
  | "pending"
  | "running"
  | "verifying"
  | "awaiting-approval"
  | "completed"
  | "failed"
  | "cancelled";

export type VerificationType =
  | "syntax"
  | "lint"
  | "unit-test"
  | "integration-test"
  | "e2e-test"
  | "security-scan"
  | "code-review"
  | "coverage"
  | "complexity"
  | "build"
  | "type-check"
  | "dependency-audit";

export interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  location?: string;
  rule?: string;
  suggestion?: string;
}

export interface VerificationResult {
  type: VerificationType;
  result: "pass" | "fail" | "warn" | "skip";
  findings: Finding[];
  report?: string;
  durationMs?: number;
}

export interface GateDecision {
  decision: "approved" | "rejected" | "needs-human";
  reason: string;
  requiresHuman: boolean;
}

export interface AgentRunResult {
  output: string;
  artifacts: Array<{ name: string; type: string; content: string; path?: string }>;
  metrics?: Record<string, number>;
  nextAgent?: AgentType;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  "requirement-analysis": "تحلیل نیازمندی‌ها",
  "architecture-design": "طراحی معماری",
  "ui-design": "طراحی رابط کاربری",
  "implementation": "پیاده‌سازی",
  "code-review": "بازبینی کد",
  "test-generation": "تولید تست",
  "documentation": "مستندسازی",
  "deployment": "استقرار",
  "bug-analysis": "تحلیل باگ",
  "security-audit": "حسابرسی امنیتی",
  "performance-analysis": "تحلیل کارایی",
  "release-prep": "آماده‌سازی انتشار",
  "custom": "سفارشی",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  "pending": "در انتظار",
  "running": "در حال اجرا",
  "verifying": "در حال تأیید",
  "awaiting-approval": "نیازمند تأیید",
  "completed": "تکمیل‌شده",
  "failed": "ناموفق",
  "cancelled": "لغوشده",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  "pending": "bg-muted text-muted-foreground",
  "running": "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "verifying": "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  "awaiting-approval": "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  "completed": "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  "failed": "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  "cancelled": "bg-muted text-muted-foreground",
};
