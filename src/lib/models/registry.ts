import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Model Registry — manage providers + models + bindings.
 */

export async function createModelProvider(input: {
  name: string;
  baseUrl: string;
  apiKey?: string;
  enabled?: boolean;
}) {
  const p = await db.modelProvider.create({
    data: {
      name: input.name,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey ?? null,
      enabled: input.enabled ?? true,
    },
  });
  await audit({
    actor: "system",
    action: "provider.created",
    targetType: "modelProvider",
    targetId: p.id,
    meta: { name: input.name },
  });
  await log("info", "system", `Provider ${p.name} created`);
  return p;
}

export async function listModels(providerId?: string) {
  return db.modelRegistry.findMany({
    where: providerId ? { providerId } : undefined,
    include: { provider: true },
    orderBy: { name: "asc" },
  });
}

export async function selectModel(input: {
  agentId: string;
  providerId: string;
  modelName?: string;
}) {
  const binding = await db.agentModelBinding.upsert({
    where: { agentId: input.agentId },
    update: { providerId: input.providerId, modelName: input.modelName ?? null },
    create: {
      agentId: input.agentId,
      providerId: input.providerId,
      modelName: input.modelName ?? null,
    },
  });
  await log("info", "system", `Agent ${input.agentId} bound to provider ${input.providerId}`);
  return binding;
}

export async function listProviders() {
  return db.modelProvider.findMany({
    include: { models: true, bindings: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function ensureDefaultProviders() {
  // No providers seeded by default — system-config fallback handles the out-of-box case.
  // Admin can configure via /api/providers.
  await log("info", "system", "Default providers check: 0 seeded (use system config fallback)");
}
