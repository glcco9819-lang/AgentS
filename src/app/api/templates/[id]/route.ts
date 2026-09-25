import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const t = await db.taskTemplate.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ template: t });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.category) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.instruction) data.instruction = body.instruction;
  if (body.agentType) data.agentType = body.agentType;
  if (body.taskType) data.taskType = body.taskType;
  if (body.verificationType) data.verificationType = body.verificationType;
  if (body.icon !== undefined) data.icon = body.icon;
  const t = await db.taskTemplate.update({ where: { id }, data });
  return NextResponse.json({ template: t });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  await db.taskTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
