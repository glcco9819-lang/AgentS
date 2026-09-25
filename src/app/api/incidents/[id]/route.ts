import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { updateIncidentStatus } from "@/lib/monitoring/incident";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const incident = await db.incident.findUnique({ where: { id } });
  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  return NextResponse.json({ incident });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.status) return NextResponse.json({ error: "status required" }, { status: 400 });
  const incident = await updateIncidentStatus(id, body.status, body.updatedBy ?? "system");
  return NextResponse.json({ incident });
}
