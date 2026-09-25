import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export async function audit(params: { workspaceId?: string; actor: string; action: string; targetType: string; targetId: string; meta?: Record<string, unknown>; }): Promise<void> {
  const last = await db.auditLog.findFirst({ orderBy: { createdAt: "desc" }, take: 1 });
  const prevHash = last?.hash ?? "genesis";
  const payload = `${prevHash}|${params.actor}|${params.action}|${params.targetType}|${params.targetId}`;
  let h = 0; for (let i = 0; i < payload.length; i++) h = ((h << 5) - h + payload.charCodeAt(i)) | 0;
  const hashStr = `${prevHash.slice(0, 8)}:${(h >>> 0).toString(16)}`;
  await db.auditLog.create({ data: { workspaceId: params.workspaceId ?? null, actor: params.actor, action: params.action, targetType: params.targetType, targetId: params.targetId, meta: params.meta ? JSON.stringify(params.meta) : null, hash: hashStr } });
  await log("info", "audit", `${params.actor} ${params.action} ${params.targetType}/${params.targetId}`, params.meta);
}
export async function getAuditTrail(workspaceId?: string, limit = 200) {
  return db.auditLog.findMany({ where: workspaceId ? { workspaceId } : undefined, orderBy: { createdAt: "desc" }, take: Math.min(limit, 1000) });
}
