import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Event Log — append-only event stream for orchestration observability.
 */

export async function emitEvent(input: {
  workspaceId?: string;
  eventType: string;
  actor: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
}) {
  const event = await db.eventLog.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      eventType: input.eventType,
      actor: input.actor,
      targetType: input.targetType,
      targetId: input.targetId,
      payload: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
  return event;
}

export async function getEvents(opts?: {
  workspaceId?: string;
  eventType?: string;
  limit?: number;
}) {
  return db.eventLog.findMany({
    where: {
      ...(opts?.workspaceId ? { workspaceId: opts.workspaceId } : {}),
      ...(opts?.eventType ? { eventType: opts.eventType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
}
