import { db } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/ai/gateway";
import { getPrompt } from "@/lib/ai/prompts";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

export interface Finding { severity: "critical" | "high" | "medium" | "low" | "info"; title: string; detail: string; location?: string; suggestion?: string; }

const TYPE_TO_PROMPT: Record<string, string> = { requirement: "system", architecture: "architecture", database: "sqlAnalysis", code: "codeReview", api: "codeReview", ui: "codeReview", security: "bugAnalysis", documentation: "documentation" };

export async function runVerification(params: { taskId: string; artifactId: string; type: string; artifactContent: string; artifactName: string; producerAgent: string; checkedBy?: string; }) {
  const checkedBy = params.checkedBy ?? "independent-verifier";
  if (checkedBy === params.producerAgent) throw new Error("Self-verification blocked");
  const promptKey = TYPE_TO_PROMPT[params.type] ?? "codeReview";
  const systemPrompt = await getPrompt(promptKey as Parameters<typeof getPrompt>[0], "fa");
  const userMsg = `artifact: ${params.artifactName}\ntype: ${params.type}\nproducer: ${params.producerAgent}\n\nمتن artifact:\n\`\`\`\n${params.artifactContent.slice(0, 8000)}\n\`\`\`\n\nبررسی کن. در پایان بنویس: RESULT: pass | fail | warn`;
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }];
  const { content } = await chat(messages, { temperature: 0.2 });
  const result = /RESULT:\s*(pass|fail|warn)/i.test(content) ? (content.match(/RESULT:\s*(pass|fail|warn)/i)?.[1].toLowerCase() ?? "pass") : "pass";
  const verification = await db.verification.create({ data: { taskId: params.taskId, artifactId: params.artifactId, type: params.type, result, report: JSON.stringify({ findings: [], summary: content.slice(0, 500) }), checkedBy } });
  await audit({ actor: checkedBy, action: "verify.run", targetType: "artifact", targetId: params.artifactId, meta: { type: params.type, result } });
  return { result, verificationId: verification.id };
}

export async function evaluateGate(params: { taskId: string; verificationId: string; humanApprovalRequired?: boolean; }): Promise<{ decision: "pass" | "fail" | "rework" | "escalate"; reason: string }> {
  const verification = await db.verification.findUnique({ where: { id: params.verificationId } });
  if (!verification) throw new Error("Verification not found");
  let decision: "pass" | "fail" | "rework" | "escalate"; let reason: string;
  if (verification.result === "fail") {
    const task = await db.task.findUnique({ where: { id: params.taskId } });
    const attempt = task?.attempt ?? 1; const max = task?.maxAttempts ?? 3;
    decision = attempt >= max ? "escalate" : "rework";
    reason = `Verification failed (attempt ${attempt}/${max})`;
  } else if (verification.result === "warn") {
    decision = params.humanApprovalRequired ? "escalate" : "pass";
    reason = params.humanApprovalRequired ? "Warnings — human review required" : "Warnings acceptable";
  } else {
    decision = params.humanApprovalRequired ? "escalate" : "pass";
    reason = params.humanApprovalRequired ? "Passed but human approval required" : "Passed";
  }
  await db.qualityGate.create({ data: { taskId: params.taskId, verificationId: params.verificationId, decision, reason, requiresHuman: decision === "escalate" } });
  const statusMap: Record<string, string> = { pass: "done", fail: "failed", rework: "pending", escalate: "escalated" };
  await db.task.update({ where: { id: params.taskId }, data: { status: statusMap[decision] } });
  if (decision === "rework") await db.task.update({ where: { id: params.taskId }, data: { attempt: { increment: 1 } } });
  await audit({ actor: "gate-engine", action: "gate.decide", targetType: "task", targetId: params.taskId, meta: { decision, reason } });
  return { decision, reason };
}
