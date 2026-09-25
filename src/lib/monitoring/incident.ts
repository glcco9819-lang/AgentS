import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Incident Management.
 */

export async function createIncident(input: {
  workspaceId?: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  assignedTo?: string;
}) {
  const incident = await db.incident.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      severity: input.severity,
      title: input.title,
      description: input.description,
      status: "open",
      assignedTo: input.assignedTo ?? null,
    },
  });
  await audit({
    workspaceId: input.workspaceId ?? null,
    actor: "incident",
    action: "incident.created",
    targetType: "incident",
    targetId: incident.id,
    meta: { severity: input.severity },
  });
  await log("warn", "system", `Incident created: ${input.title}`, {
    severity: input.severity,
  });
  return incident;
}

export async function updateIncidentStatus(
  id: string,
  status: "open" | "investigating" | "resolved" | "closed",
  resolvedBy: string
) {
  const data: Record<string, unknown> = { status };
  if (status === "resolved" || status === "closed") {
    data.resolvedAt = new Date();
  }
  const updated = await db.incident.update({ where: { id }, data });
  await audit({
    workspaceId: updated.workspaceId ?? null,
    actor: resolvedBy,
    action: `incident.${status}`,
    targetType: "incident",
    targetId: id,
    meta: {},
  });
  await log("info", "system", `Incident ${id} → ${status}`);
  return updated;
}

export async function listIncidents(workspaceId?: string, status?: string) {
  return db.incident.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
