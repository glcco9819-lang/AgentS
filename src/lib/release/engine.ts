import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { enforceAllReleaseGates } from "@/lib/governance/hard-gates";

/**
 * Release Engine — create/verify/approve/publish/rollback releases.
 */

export async function createRelease(input: {
  workspaceId: string;
  environmentId?: string;
  version: string;
  name: string;
  notes?: string;
  commitSha?: string;
}) {
  const release = await db.release.create({
    data: {
      workspaceId: input.workspaceId,
      environmentId: input.environmentId ?? null,
      version: input.version,
      name: input.name,
      notes: input.notes ?? null,
      status: "draft",
      commitSha: input.commitSha ?? null,
    },
  });
  await audit({
    workspaceId: input.workspaceId,
    actor: "release",
    action: "release.created",
    targetType: "release",
    targetId: release.id,
    meta: { version: input.version },
  });
  await log("info", "system", `Release ${release.id} (${input.version}) created`);
  return release;
}

export async function verifyRelease(id: string) {
  const result = await enforceAllReleaseGates(id);
  const newStatus = result.failed === 0 ? "verified" : "blocked";
  await db.release.update({ where: { id }, data: { status: newStatus } });
  await log("info", "system", `Release ${id} verified`, { passed: result.passed, failed: result.failed });
  return { status: newStatus, ...result };
}

export async function approveRelease(id: string, approvedBy: string) {
  const release = await db.release.findUnique({ where: { id } });
  if (!release) throw new Error("Release not found");
  await db.release.update({ where: { id }, data: { status: "approved" } });
  await audit({
    workspaceId: release.workspaceId,
    actor: approvedBy,
    action: "release.approved",
    targetType: "release",
    targetId: id,
    meta: { version: release.version },
  });
  return { status: "approved" };
}

export async function publishRelease(id: string, publishedBy: string) {
  const release = await db.release.findUnique({ where: { id } });
  if (!release) throw new Error("Release not found");
  await db.release.update({
    where: { id },
    data: { status: "published", releasedAt: new Date() },
  });
  // Update project state
  await db.projectState.upsert({
    where: { workspaceId: release.workspaceId },
    update: { lastReleaseId: id },
    create: { workspaceId: release.workspaceId, lastReleaseId: id },
  });
  await audit({
    workspaceId: release.workspaceId,
    actor: publishedBy,
    action: "release.published",
    targetType: "release",
    targetId: id,
    meta: { version: release.version },
  });
  await log("info", "system", `Release ${id} published`);
  return { status: "published" };
}

export async function rollbackRelease(id: string, rolledBackBy: string) {
  const release = await db.release.findUnique({ where: { id } });
  if (!release) throw new Error("Release not found");
  await db.release.update({ where: { id }, data: { status: "rolled-back" } });
  await audit({
    workspaceId: release.workspaceId,
    actor: rolledBackBy,
    action: "release.rolled-back",
    targetType: "release",
    targetId: id,
    meta: { version: release.version },
  });
  await log("warn", "system", `Release ${id} rolled back by ${rolledBackBy}`);
  return { status: "rolled-back" };
}

export async function listReleases(workspaceId?: string) {
  return db.release.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getRelease(id: string) {
  return db.release.findUnique({ where: { id } });
}
