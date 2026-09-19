import { NextRequest } from "next/server";
import { getLogs, type LogLevel } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/logs?level=info&limit=200 */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get("level") as LogLevel | null;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "200", 10);
  const logs = await getLogs(isNaN(limit) ? 200 : limit, level ?? undefined);
  return Response.json({ logs });
}
