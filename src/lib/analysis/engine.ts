import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { chatStream, type ChatMessage } from "@/lib/ai/gateway";
import { getIntelligenceStats } from "@/lib/intelligence/scanner";
import { scanEnvironment } from "@/lib/intelligence/scanner";

/**
 * Analysis Engine — produces analysis reports with streaming AI output.
 * Uses environment intelligence context to ground the AI.
 */

export type AnalysisKind =
  | "code-quality"
  | "architecture"
  | "security"
  | "performance"
  | "tech-debt";

export const ANALYSIS_LABELS: Record<AnalysisKind, string> = {
  "code-quality": "کیفیت کد",
  "architecture": "معماری",
  "security": "امنیت",
  "performance": "کارایی",
  "tech-debt": "بدهی فنی",
};

export async function gatherContext(environmentId?: string) {
  if (!environmentId) return { context: "", stats: null };
  const stats = await getIntelligenceStats(environmentId).catch(() => null);
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) return { context: "", stats };
  // Sample files for context window
  const files = await db.fileIndex.findMany({
    where: { environmentId },
    take: 50,
    orderBy: { size: "desc" },
  });
  const fileList = files.map((f) => `- ${f.path} (${f.language}, ${f.lineCount} lines)`).join("\n");
  const context =
    `Environment: ${env.name} (branch ${env.branch})\n` +
    `Languages: ${JSON.stringify(stats?.byLanguage ?? {})}\n` +
    `Files: ${stats?.totalFiles ?? 0} | Symbols: ${stats?.totalSymbols ?? 0} | Edges: ${stats?.totalEdges ?? 0}\n\n` +
    `Top files:\n${fileList}`;
  return { context, stats };
}

export async function* analyzeStream(input: {
  environmentId?: string;
  workspaceId?: string;
  kind: AnalysisKind;
  prompt?: string;
}): AsyncGenerator<string, void, unknown> {
  const { context } = await gatherContext(input.environmentId);
  const kindLabel = ANALYSIS_LABELS[input.kind];

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        `You are a software analyzer focused on ${input.kind}. ` +
        `Produce a structured Persian-language report in Markdown: ` +
        `## خلاصه\n## یافته‌ها\n## توصیه‌ها.\n\nBe specific and reference files.`,
    },
    {
      role: "user",
      content:
        (context ? `Project intelligence:\n${context}\n\n` : "") +
        `Analyze ${kindLabel} for this project.` +
        (input.prompt ? `\n\nFocus: ${input.prompt}` : ""),
    },
  ];

  // Persist report header while streaming
  const report = await db.analysisReport.create({
    data: {
      projectId: input.environmentId ?? input.workspaceId ?? "default",
      kind: input.kind,
      title: `گزارش ${kindLabel}`,
      summary: "در حال تولید...",
      findings: "[]",
    },
  });

  let full = "";
  try {
    for await (const chunk of chatStream(messages, { temperature: 0.4 })) {
      full += chunk;
      yield chunk;
    }
  } catch (e) {
    full += `\n\n**خطا:** ${(e as Error).message}`;
    yield `\n\n**خطا:** ${(e as Error).message}`;
  }

  await db.analysisReport.update({
    where: { id: report.id },
    data: { summary: full.slice(0, 4000), findings: JSON.stringify({ full }) },
  });
  await log("info", "system", `Analysis ${input.kind} completed`, {
    reportId: report.id,
  });
}

export async function listAnalysisReports(projectId?: string) {
  return db.analysisReport.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
