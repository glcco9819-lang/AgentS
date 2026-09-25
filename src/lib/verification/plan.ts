import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import type { VerificationType } from "@/lib/core/types";

/**
 * Verification Plan — define the set of checks for a task or release.
 */

export interface PlanCheck {
  type: VerificationType;
  riskLevel: "low" | "medium" | "high";
}

export async function createVerificationPlan(input: {
  workspaceId: string;
  taskId?: string;
  releaseId?: string;
  checks: PlanCheck[];
  riskLevel?: string;
}) {
  const plan = await db.verificationPlan.create({
    data: {
      workspaceId: input.workspaceId,
      taskId: input.taskId ?? null,
      releaseId: input.releaseId ?? null,
      checks: JSON.stringify(input.checks),
      riskLevel: input.riskLevel ?? "medium",
      status: "draft",
    },
  });
  await log("info", "system", `Verification plan ${plan.id} created`, {
    checks: input.checks.length,
  });
  return plan;
}

export async function listVerificationPlans(workspaceId?: string) {
  return db.verificationPlan.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getVerificationPlan(id: string) {
  return db.verificationPlan.findUnique({
    where: { id },
    include: { runs: true },
  });
}
