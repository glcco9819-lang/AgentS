import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Rollback — snapshot workspace state for later restoration.
 */

export interface WorkspaceSnapshot {
  workspaceId: string;
  capturedAt: string;
  tasks: number;
  artifacts: number;
  releases: number;
  state: Record<string, unknown>;
}

export async function snapshot(workspaceId: string): Promise<WorkspaceSnapshot> {
  const [tasks, artifacts, releases] = await Promise.all([
    db.task.findMany({ where: { workspaceId } }),
    db.artifact.findMany({ where: { workspaceId } }),
    db.release.findMany({ where: { workspaceId } }),
  ]);
  const snap: WorkspaceSnapshot = {
    workspaceId,
    capturedAt: new Date().toISOString(),
    tasks: tasks.length,
    artifacts: artifacts.length,
    releases: releases.length,
    state: {
      taskStatuses: tasks.map((t) => ({ id: t.id, status: t.status })),
      releaseStatuses: releases.map((r) => ({ id: r.id, status: r.status })),
    },
  };
  await audit({
    workspaceId,
    actor: "rollback",
    action: "snapshot.created",
    targetType: "workspace",
    targetId: workspaceId,
    meta: snap,
  });
  await log("info", "system", `Snapshot created for workspace ${workspaceId}`, snap);
  return snap;
}

export async function rollback(workspaceId: string, snap: WorkspaceSnapshot): Promise<void> {
  if (snap.workspaceId !== workspaceId) throw new Error("Snapshot workspace mismatch");
  // Restore task statuses (minimal rollback — restore state, not data)
  for (const t of snap.state.taskStatuses as Array<{ id: string; status: string }>) {
    await db.task.update({ where: { id: t.id }, data: { status: t.status } }).catch(() => {});
  }
  for (const r of snap.state.releaseStatuses as Array<{ id: string; status: string }>) {
    await db.release.update({ where: { id: r.id }, data: { status: r.status } }).catch(() => {});
  }
  await audit({
    workspaceId,
    actor: "rollback",
    action: "rollback.applied",
    targetType: "workspace",
    targetId: workspaceId,
    meta: { snapshotAt: snap.capturedAt },
  });
  await log("warn", "system", `Rollback applied to workspace ${workspaceId}`, {
    snapshotAt: snap.capturedAt,
  });
}
