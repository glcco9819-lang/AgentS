import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getEvents } from "@/lib/orchestration/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const eventType = url.searchParams.get("eventType") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const events = await getEvents({ workspaceId, eventType, limit });
  return NextResponse.json({ events });
}
