import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import type { AgentType } from "@/lib/core/types";

/**
 * Agent Registry
 * --------------
 * - AGENT_SEEDS: 27 agent definitions seeded into the DB.
 * - ensureDefaultAgents(): seeds them on first boot.
 * - listAgentsWithContracts(): joins Agent + AgentContract.
 * - getAgentFullProfile(): full profile with versions, contracts, policies.
 * - validateAgentCanExecute(): contract-aware execution guard.
 */

export interface AgentSeed {
  name: string;
  domain: string;
  type: AgentType;
  version?: string;
}

export const AGENT_SEEDS: AgentSeed[] = [
  { name: "YFG-PM", domain: "product", type: "product-manager" },
  { name: "YFG-Arch", domain: "architecture", type: "architect" },
  { name: "YFG-UX", domain: "design", type: "ux-designer" },
  { name: "YFG-FE", domain: "frontend", type: "frontend-engineer" },
  { name: "YFG-BE", domain: "backend", type: "backend-engineer" },
  { name: "YFG-DBE", domain: "database", type: "database-engineer" },
  { name: "YFG-DevOps", domain: "devops", type: "devops-engineer" },
  { name: "YFG-QA", domain: "quality", type: "qa-engineer" },
  { name: "YFG-Sec", domain: "security", type: "security-engineer" },
  { name: "YFG-Reviewer", domain: "review", type: "code-reviewer" },
  { name: "YFG-Doc", domain: "documentation", type: "doc-writer" },
  { name: "YFG-API", domain: "api", type: "api-designer" },
  { name: "YFG-TestArch", domain: "testing", type: "test-architect" },
  { name: "YFG-Rel", domain: "release", type: "release-engineer" },
  { name: "YFG-SRE", domain: "sre", type: "sre-engineer" },
  { name: "YFG-Data", domain: "data", type: "data-scientist" },
  { name: "YFG-ML", domain: "ml", type: "ml-engineer" },
  { name: "YFG-Integ", domain: "integration", type: "integration-engineer" },
  { name: "YFG-Mobile", domain: "mobile", type: "mobile-engineer" },
  { name: "YFG-Platform", domain: "platform", type: "platform-engineer" },
  { name: "YFG-Perf", domain: "performance", type: "performance-engineer" },
  { name: "YFG-A11y", domain: "accessibility", type: "accessibility-engineer" },
  { name: "YFG-I18n", domain: "i18n", type: "i18n-engineer" },
  { name: "YFG-TechW", domain: "techwriting", type: "tech-writer" },
  { name: "YFG-Scrum", domain: "process", type: "scrum-master" },
  { name: "YFG-Compliance", domain: "compliance", type: "compliance-officer" },
  { name: "YFG-Incident", domain: "incident", type: "incident-responder" },
];

export async function ensureDefaultAgents(): Promise<void> {
  for (const seed of AGENT_SEEDS) {
    await db.agent.upsert({
      where: { name: seed.name },
      update: { domain: seed.domain, type: seed.type },
      create: {
        name: seed.name,
        domain: seed.domain,
        type: seed.type,
        version: seed.version ?? "1.0.0",
      },
    });
    // Ensure resource + handoff policies
    const agent = await db.agent.findUnique({ where: { name: seed.name } });
    if (agent) {
      await db.agentResourcePolicy.upsert({
        where: { agentId: agent.id },
        update: {},
        create: { agentId: agent.id },
      });
      await db.agentHandoffPolicy.upsert({
        where: { agentId: agent.id },
        update: {},
        create: { agentId: agent.id },
      });
    }
  }
  await audit({
    actor: "system",
    action: "agents.seed",
    targetType: "agent",
    targetId: "batch",
    meta: { count: AGENT_SEEDS.length },
  });
  await log("info", "system", `Default agents ensured (${AGENT_SEEDS.length})`);
}

export async function listAgents() {
  return db.agent.findMany({ orderBy: { name: "asc" } });
}

export async function getAgentByType(type: AgentType) {
  return db.agent.findFirst({ where: { type } });
}

export async function listAgentsWithContracts() {
  const agents = await db.agent.findMany({ orderBy: { name: "asc" } });
  const contractIds = agents.map((a) => a.id);
  const contracts = await db.agentContract.findMany({
    where: { agentId: { in: contractIds } },
  });
  const contractMap = new Map(contracts.map((c) => [c.agentId, c]));
  return agents.map((a) => ({
    ...a,
    contract: contractMap.get(a.id) ?? null,
  }));
}

export async function getAgentFullProfile(id: string) {
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) throw new Error("Agent not found");
  const [contract, versions, contracts, resourcePolicy, handoffPolicy, modelBinding] = await Promise.all([
    db.agentContract.findUnique({ where: { agentId: id } }),
    db.agentVersion.findMany({ where: { agentId: id }, orderBy: { createdAt: "desc" } }),
    db.contractVersion.findMany({ where: { agentId: id }, orderBy: { createdAt: "desc" } }),
    db.agentResourcePolicy.findUnique({ where: { agentId: id } }),
    db.agentHandoffPolicy.findUnique({ where: { agentId: id } }),
    db.agentModelBinding.findUnique({ where: { agentId: id }, include: { provider: true } }),
  ]);
  return { agent, contract, versions, contracts, resourcePolicy, handoffPolicy, modelBinding };
}

export async function validateAgentCanExecute(input: {
  agentId: string;
  taskType: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const agent = await db.agent.findUnique({ where: { id: input.agentId } });
  if (!agent) return { ok: false, reason: "Agent not found" };
  if (!agent.enabled) return { ok: false, reason: "Agent disabled" };
  const contract = await db.agentContract.findUnique({ where: { agentId: input.agentId } });
  if (contract) {
    try {
      const caps = JSON.parse(contract.capabilities) as string[];
      if (caps.length > 0 && !caps.includes(input.taskType)) {
        return { ok: false, reason: `Task type '${input.taskType}' not in agent capabilities` };
      }
    } catch {
      // ignore
    }
  }
  return { ok: true };
}
