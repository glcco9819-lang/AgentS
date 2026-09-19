import { db } from "@/lib/db";

export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogSource =
  | "gateway"
  | "chat"
  | "project"
  | "scanner"
  | "system"
  | "settings"
  | "prompt";

/**
 * System Logger — writes structured logs to the database (SystemLog table)
 * and mirrors to console. Powers the in-app Logs view.
 */
export async function log(
  level: LogLevel,
  source: LogSource,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const line = `[${level.toUpperCase()}] [${source}] ${message}`;
  if (level === "error") console.error(line, meta ?? "");
  else if (level === "warn") console.warn(line, meta ?? "");
  else console.log(line, meta ?? "");

  try {
    await db.systemLog.create({
      data: {
        level,
        source,
        message,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch (e) {
    // Never let logging failure break the request flow
    console.error("logger: failed to persist log", e);
  }
}

export async function getLogs(limit = 200, level?: LogLevel) {
  return db.systemLog.findMany({
    where: level ? { level } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 1000),
  });
}
