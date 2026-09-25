import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Agent Lifecycle — versioning + contract management.
 */

export async function createAgentVersion(input: {
  agentId: string;
  version: string;
  changes?: string;
  active?: boolean;
}) {
  const created = await db.agentVersion.create({ data: input });
  await audit({
    actor: "system",
    action: "agent.version.created",
    targetType: "agent",
    targetId: input.agentId,
    meta: { version: input.version },
  });
  return created;
}

export async function createContractVersion(input: {
  agentId: string;
  version: string;
  capabilities: string;
  permissions: string;
  tools: string;
  models?: string;
  changeReason?: string;
}) {
  const created = await db.contractVersion.create({ data: input });
  await audit({
    actor: "system",
    action: "contract.version.created",
    targetType: "agent",
    targetId: input.agentId,
    meta: { version: input.version },
  });
  return created;
}

export async function approveContractVersion(id: string, approvedBy: string) {
  const updated = await db.contractVersion.update({
    where: { id },
    data: { approved: true, approvedBy },
  });
  await audit({
    actor: approvedBy,
    action: "contract.approved",
    targetType: "contractVersion",
    targetId: id,
    meta: {},
  });
  await log("info", "system", `Contract version ${id} approved by ${approvedBy}`);
  return updated;
}

export async function listAgentVersions(agentId: string) {
  return db.agentVersion.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listContractVersions(agentId: string) {
  return db.contractVersion.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
}
