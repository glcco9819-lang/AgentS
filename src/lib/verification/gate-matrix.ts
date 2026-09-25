import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Gate Matrix — evaluate all gates for a task or release.
 */

export interface GateMatrixInput {
  taskId?: string;
  workspaceId?: string;
}

export interface GateMatrixResult {
  total: number;
  approved: number;
  rejected: number;
  needsHuman: number;
  gates: Array<{ id: string; decision: string; reason: string | null; requiresHuman: boolean }>;
}

export async function evaluateGateMatrix(input: GateMatrixInput): Promise<GateMatrixResult> {
  const gates = await db.qualityGate.findMany({
    where: {
      ...(input.taskId ? { taskId: input.taskId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const result: GateMatrixResult = {
    total: gates.length,
    approved: gates.filter((g) => g.decision === "approved").length,
    rejected: gates.filter((g) => g.decision === "rejected").length,
    needsHuman: gates.filter((g) => g.decision === "needs-human").length,
    gates: gates.map((g) => ({
      id: g.id,
      decision: g.decision,
      reason: g.reason,
      requiresHuman: g.requiresHuman,
    })),
  };

  await log("debug", "system", `Gate matrix evaluated`, {
    total: result.total,
    approved: result.approved,
  });

  return result;
}

export async function ensureDefaultGateRules() {
  const defaults = [
    { name: "low-risk", riskLevel: "low", requiredVerifications: ["syntax"], requiresHumanApproval: false },
    { name: "medium-risk", riskLevel: "medium", requiredVerifications: ["syntax", "code-review"], requiresHumanApproval: false },
    { name: "high-risk", riskLevel: "high", requiredVerifications: ["syntax", "code-review", "security-scan"], requiresHumanApproval: true },
    { name: "release", riskLevel: "high", requiredVerifications: ["build", "unit-test", "security-scan"], requiresHumanApproval: true },
  ];
  for (const r of defaults) {
    await db.qualityGateRule.upsert({
      where: { name: r.name },
      update: {
        riskLevel: r.riskLevel,
        requiredVerifications: JSON.stringify(r.requiredVerifications),
        requiresHumanApproval: r.requiresHumanApproval,
      },
      create: {
        name: r.name,
        riskLevel: r.riskLevel,
        requiredVerifications: JSON.stringify(r.requiredVerifications),
        requiresHumanApproval: r.requiresHumanApproval,
      },
    });
  }
  await log("info", "system", `Default gate rules ensured (${defaults.length})`);
}
