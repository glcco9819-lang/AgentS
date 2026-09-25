import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Reporting — generate comprehensive workspace reports.
 */

export async function generateWorkspaceReport(workspaceId: string) {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("Workspace not found");

  const [tasks, artifacts, verifications, gates, releases, incidents, audits] = await Promise.all([
    db.task.findMany({ where: { workspaceId }, include: { agent: true }, take: 100, orderBy: { createdAt: "desc" } }),
    db.artifact.findMany({ where: { workspaceId }, take: 100, orderBy: { createdAt: "desc" } }),
    db.verification.findMany({ where: { task: { workspaceId } }, take: 100, orderBy: { createdAt: "desc" } }),
    db.qualityGate.findMany({ where: { task: { workspaceId } }, take: 100, orderBy: { createdAt: "desc" } }),
    db.release.findMany({ where: { workspaceId }, take: 50, orderBy: { createdAt: "desc" } }),
    db.incident.findMany({ where: { workspaceId }, take: 50, orderBy: { createdAt: "desc" } }),
    db.auditLog.findMany({ where: { workspaceId }, take: 100, orderBy: { createdAt: "desc" } }),
  ]);

  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const running = tasks.filter((t) => t.status === "running").length;
  const verificationsPass = verifications.filter((v) => v.result === "pass").length;
  const verificationsFail = verifications.filter((v) => v.result === "fail").length;
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const lastRelease = releases.find((r) => r.status === "published");

  await log("info", "system", `Report generated for workspace ${workspaceId}`, {
    tasks: tasks.length,
    artifacts: artifacts.length,
    verifications: verifications.length,
  });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      language: workspace.language,
      framework: workspace.framework,
      status: workspace.status,
      vision: workspace.vision,
      createdAt: workspace.createdAt,
    },
    summary: {
      totalTasks: tasks.length,
      completed,
      failed,
      pending,
      running,
      totalArtifacts: artifacts.length,
      totalVerifications: verifications.length,
      verificationsPass,
      verificationsFail,
      totalGates: gates.length,
      totalReleases: releases.length,
      totalIncidents: incidents.length,
      openIncidents,
      lastRelease: lastRelease
        ? { version: lastRelease.version, releasedAt: lastRelease.releasedAt }
        : null,
    },
    recentTasks: tasks.slice(0, 10),
    recentArtifacts: artifacts.slice(0, 5),
    recentReleases: releases.slice(0, 5),
    recentIncidents: incidents.slice(0, 5),
    recentAudit: audits.slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}
