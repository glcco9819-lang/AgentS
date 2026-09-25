import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

const HUMAN_REQUIRED_GATES = ["product-scope", "architecture", "db-change", "security", "release", "production-deploy"];
export function requiresHumanApproval(gateType: string): boolean { return HUMAN_REQUIRED_GATES.includes(gateType); }

export async function requestApproval(params: { taskId: string; gateType: string; comment?: string; }): Promise<string> {
  const approval = await db.approval.create({ data: { taskId: params.taskId, gateType: params.gateType, status: "pending", comment: params.comment ?? null } });
  await db.task.update({ where: { id: params.taskId }, data: { status: "gated" } });
  await audit({ actor: "system", action: "approval.requested", targetType: "task", targetId: params.taskId, meta: { gateType: params.gateType, approvalId: approval.id } });
  return approval.id;
}
export async function decideApproval(params: { approvalId: string; decision: "approved" | "rejected"; decidedBy: string; comment?: string; }): Promise<{ taskId: string; status: string }> {
  const approval = await db.approval.findUnique({ where: { id: params.approvalId } });
  if (!approval) throw new Error("Approval not found");
  if (approval.status !== "pending") throw new Error("Already decided");
  await db.approval.update({ where: { id: params.approvalId }, data: { status: params.decision, decidedBy: params.decidedBy, comment: params.comment ?? null, decidedAt: new Date() } });
  const status = params.decision === "approved" ? "approved" : "failed";
  await db.task.update({ where: { id: approval.taskId }, data: { status } });
  await audit({ actor: params.decidedBy, action: "approval.decided", targetType: "task", targetId: approval.taskId, meta: { gateType: approval.gateType, decision: params.decision } });
  return { taskId: approval.taskId, status };
}
export async function pendingApprovals(workspaceId?: string) {
  const tasks = workspaceId ? await db.task.findMany({ where: { workspaceId, status: "gated" } }) : await db.task.findMany({ where: { status: "gated" } });
  const taskIds = tasks.map((t) => t.id);
  return db.approval.findMany({ where: { taskId: { in: taskIds }, status: "pending" }, orderBy: { createdAt: "desc" } });
}
