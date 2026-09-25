import { db } from "@/lib/db";
import { audit } from "@/lib/governance/audit";
export async function linkTrace(params: { workspaceId: string; sourceType: string; sourceId: string; targetType: string; targetId: string; relation: string; taskId?: string; }): Promise<void> {
  await db.traceLink.create({ data: { workspaceId: params.workspaceId, sourceType: params.sourceType, sourceId: params.sourceId, targetType: params.targetType, targetId: params.targetId, relation: params.relation, taskId: params.taskId ?? null } });
  await audit({ workspaceId: params.workspaceId, actor: "system", action: "trace.link", targetType: params.targetType, targetId: params.targetId, meta: { from: `${params.sourceType}/${params.sourceId}`, relation: params.relation } });
}
export async function traceForward(sourceType: string, sourceId: string) { return db.traceLink.findMany({ where: { sourceType, sourceId }, orderBy: { createdAt: "asc" } }); }
export async function traceBackward(targetType: string, targetId: string) { return db.traceLink.findMany({ where: { targetType, targetId }, orderBy: { createdAt: "asc" } }); }
export async function fullChain(workspaceId: string) { const links = await db.traceLink.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }); const targets = new Set(links.map((l) => `${l.targetType}:${l.targetId}`)); const roots = [...new Set(links.map((l) => `${l.sourceType}:${l.sourceId}`))].filter((k) => !targets.has(k)); return { links, roots }; }
