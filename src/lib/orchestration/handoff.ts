import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Handoff Package — structured data passed between agents.
 */

export interface HandoffPackageInput {
  taskId: string;
  artifactId?: string;
  version?: string;
  requirementsCovered?: string[];
  filesChanged?: string[];
  testsExecuted?: string[];
  results?: Record<string, unknown>;
  knownIssues?: string[];
  securityResults?: Record<string, unknown>;
  dependencies?: string[];
  verificationStatus?: string;
  rollbackInfo?: string;
}

export async function createHandoffPackage(input: HandoffPackageInput) {
  const hp = await db.handoffPackage.create({
    data: {
      taskId: input.taskId,
      artifactId: input.artifactId ?? null,
      version: input.version ?? null,
      requirementsCovered: input.requirementsCovered ? JSON.stringify(input.requirementsCovered) : null,
      filesChanged: input.filesChanged ? JSON.stringify(input.filesChanged) : null,
      testsExecuted: input.testsExecuted ? JSON.stringify(input.testsExecuted) : null,
      results: input.results ? JSON.stringify(input.results) : null,
      knownIssues: input.knownIssues ? JSON.stringify(input.knownIssues) : null,
      securityResults: input.securityResults ? JSON.stringify(input.securityResults) : null,
      dependencies: input.dependencies ? JSON.stringify(input.dependencies) : null,
      verificationStatus: input.verificationStatus ?? null,
      rollbackInfo: input.rollbackInfo ?? null,
    },
  });
  await audit({
    workspaceId: null,
    actor: "handoff",
    action: "handoff.created",
    targetType: "handoffPackage",
    targetId: hp.id,
    meta: { taskId: input.taskId },
  });
  await log("info", "system", `Handoff package ${hp.id} created for task ${input.taskId}`);
  return hp;
}

export async function validateHandoff(id: string): Promise<{ ok: boolean; issues: string[] }> {
  const hp = await db.handoffPackage.findUnique({ where: { id } });
  if (!hp) return { ok: false, issues: ["Handoff not found"] };
  const issues: string[] = [];
  if (!hp.requirementsCovered) issues.push("Missing requirements coverage");
  if (!hp.filesChanged) issues.push("No files-changed manifest");
  if (!hp.verificationStatus) issues.push("Missing verification status");
  if (!hp.rollbackInfo) issues.push("Missing rollback info");
  return { ok: issues.length === 0, issues };
}

export async function listHandoffPackages(taskId?: string) {
  return db.handoffPackage.findMany({
    where: taskId ? { taskId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
