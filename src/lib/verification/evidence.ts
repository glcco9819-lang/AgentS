import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { createHash } from "crypto";

/**
 * Evidence Bundle — seal a collection of evidence items with a hash.
 */

export interface EvidenceItem {
  type: string;
  content: string;
  hash: string;
}

export function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function createEvidenceBundle(input: {
  workspaceId: string;
  releaseId?: string;
  taskId?: string;
  items: EvidenceItem[];
}) {
  const bundle = await db.evidenceBundle.create({
    data: {
      workspaceId: input.workspaceId,
      releaseId: input.releaseId ?? null,
      taskId: input.taskId ?? null,
      items: JSON.stringify(input.items),
      bundleHash: null,
    },
  });
  await log("info", "system", `Evidence bundle ${bundle.id} created`, {
    items: input.items.length,
  });
  return bundle;
}

export async function sealBundle(id: string): Promise<{ bundleHash: string }> {
  const bundle = await db.evidenceBundle.findUnique({ where: { id } });
  if (!bundle) throw new Error("Bundle not found");
  const hash = computeHash(bundle.items);
  await db.evidenceBundle.update({ where: { id }, data: { bundleHash: hash } });
  await audit({
    workspaceId: bundle.workspaceId,
    actor: "evidence",
    action: "bundle.sealed",
    targetType: "evidenceBundle",
    targetId: id,
    meta: { hash },
  });
  return { bundleHash: hash };
}

export async function listEvidenceBundles(workspaceId?: string) {
  return db.evidenceBundle.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
