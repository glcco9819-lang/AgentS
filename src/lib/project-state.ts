import { db } from "@/lib/db";

/**
 * Project State — per-workspace summary state.
 */

export async function getProjectState(workspaceId: string) {
  let state = await db.projectState.findUnique({ where: { workspaceId } });
  if (!state) {
    state = await db.projectState.create({ data: { workspaceId } });
  }
  return state;
}

export async function refreshProjectState(workspaceId: string) {
  const [openTasks, openApprovals, openIncidents, lastRelease] = await Promise.all([
    db.task.count({ where: { workspaceId, status: { in: ["pending", "running", "verifying", "awaiting-approval"] } } }),
    db.approval.count({ where: { task: { workspaceId }, status: "pending" } }),
    db.incident.count({ where: { workspaceId, status: "open" } }),
    db.release.findFirst({ where: { workspaceId, status: "published" }, orderBy: { releasedAt: "desc" } }),
  ]);
  const health = openIncidents > 0 ? "red" : openApprovals > 2 ? "amber" : "green";
  const state = await db.projectState.upsert({
    where: { workspaceId },
    update: {
      openTasks,
      openApprovals,
      openIncidents,
      lastReleaseId: lastRelease?.id ?? null,
      health,
    },
    create: { workspaceId, openTasks, openApprovals, openIncidents, lastReleaseId: lastRelease?.id ?? null, health },
  });
  return state;
}

export async function listProjectStates() {
  return db.projectState.findMany({ orderBy: { updatedAt: "desc" } });
}
