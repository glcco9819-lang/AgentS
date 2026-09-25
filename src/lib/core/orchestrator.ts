import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { AGENT_REGISTRY } from "@/lib/agents/base-agent";
import { runVerification, evaluateGate } from "@/lib/verification/engine";
import { requestApproval, requiresHumanApproval } from "@/lib/governance/approval";

export interface CreateTaskParams {
  workspaceId: string; agentType: string; type: string; title: string;
  instruction: string; verificationType: string; approvalGate?: string;
}

export async function createAndRunTask(params: CreateTaskParams) {
  const agent = AGENT_REGISTRY[params.agentType];
  if (!agent) throw new Error(`Unknown agent: ${params.agentType}`);
  let agentRow = await db.agent.findUnique({ where: { name: agent.name } });
  if (!agentRow) agentRow = await db.agent.create({ data: { name: agent.name, domain: agent.domain, type: agent.type } });

  // HG-01: ensure contract exists
  let contract = await db.agentContract.findUnique({ where: { agentId: agentRow.id } });
  if (!contract) contract = await db.agentContract.create({ data: { agentId: agentRow.id, capabilities: JSON.stringify([agent.domain]), permissions: JSON.stringify(["task.run"]), tools: JSON.stringify(["ai-gateway"]) } });

  const task = await db.task.create({ data: { workspaceId: params.workspaceId, agentId: agentRow.id, type: params.type, title: params.title, input: JSON.stringify({ instruction: params.instruction }), status: "pending" } });
  await audit({ workspaceId: params.workspaceId, actor: "orchestrator", action: "task.create", targetType: "task", targetId: task.id, meta: { agentType: params.agentType } });

  try {
    const { artifactId, content } = await agent.run({ taskId: task.id, workspaceId: params.workspaceId, agentId: agentRow.id }, params.instruction);
    const verification = await runVerification({ taskId: task.id, artifactId, type: params.verificationType, artifactContent: content, artifactName: params.title, producerAgent: agent.name });
    const latestVerification = await db.verification.findFirst({ where: { taskId: task.id }, orderBy: { createdAt: "desc" } });
    const humanApprovalRequired = params.approvalGate ? requiresHumanApproval(params.approvalGate) : false;
    const gate = await evaluateGate({ taskId: task.id, verificationId: latestVerification!.id, humanApprovalRequired });
    if (gate.decision === "escalate" && params.approvalGate) await requestApproval({ taskId: task.id, gateType: params.approvalGate, comment: gate.reason });
    await db.task.update({ where: { id: task.id }, data: { finishedAt: new Date() } });
    return { taskId: task.id, status: gate.decision === "pass" ? "done" : gate.decision === "rework" ? "pending" : gate.decision, artifactId, verificationResult: verification.result, gateDecision: gate.decision };
  } catch (e) {
    await db.task.update({ where: { id: task.id }, data: { status: "failed", finishedAt: new Date() } });
    await audit({ workspaceId: params.workspaceId, actor: "orchestrator", action: "task.failed", targetType: "task", targetId: task.id, meta: { error: (e as Error).message } });
    throw e;
  }
}
