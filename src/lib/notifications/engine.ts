import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Notifications — lightweight in-app notification queue.
 */

export async function notify(input: {
  recipient: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const n = await db.notification.create({
    data: {
      recipient: input.recipient,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    },
  });
  await log("info", "system", `Notification sent to ${input.recipient}`, { type: input.type });
  return n;
}

export async function getNotifications(recipient: string, unreadOnly = false) {
  return db.notification.findMany({
    where: {
      recipient,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markRead(id: string) {
  return db.notification.update({ where: { id }, data: { read: true } });
}

export async function listAllNotifications(limit = 100) {
  return db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
