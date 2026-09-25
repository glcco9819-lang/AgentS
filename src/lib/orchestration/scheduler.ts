import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Scheduler — queue tasks for execution.
 */

export async function scheduleTask(input: {
  taskId: string;
  runAt?: Date;
  priority?: number;
}) {
  // Tasks already created with status=pending are queued; this is a thin wrapper.
  const task = await db.task.findUnique({ where: { id: input.taskId } });
  if (!task) throw new Error("Task not found");
  await log("info", "system", `Task ${input.taskId} scheduled`, {
    runAt: input.runAt ?? "now",
    priority: input.priority ?? 0,
  });
  return task;
}

export async function getQueuedTasks(workspaceId?: string) {
  return db.task.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      status: "pending",
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}
