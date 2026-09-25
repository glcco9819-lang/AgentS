import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createIncident, listIncidents } from "@/lib/monitoring/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const incidents = await listIncidents(workspaceId, status);
  return NextResponse.json({ incidents });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.severity || !body.title || !body.description) {
    return NextResponse.json({ error: "severity, title, description required" }, { status: 400 });
  }
  const incident = await createIncident({
    workspaceId: body.workspaceId,
    severity: body.severity,
    title: body.title,
    description: body.description,
    assignedTo: body.assignedTo,
  });
  return NextResponse.json({ incident });
}
