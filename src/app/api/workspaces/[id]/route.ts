import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";
import { generateWorkspaceReport } from "@/lib/core/reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const ws = await db.workspace.findUnique({
    where: { id },
    include: {
      _count: { select: { tasks: true, artifacts: true, audits: true } },
    },
  });
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  return NextResponse.json({ workspace: ws });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.rootPath) data.rootPath = body.rootPath;
  if (body.language !== undefined) data.language = body.language;
  if (body.framework !== undefined) data.framework = body.framework;
  if (body.vision !== undefined) data.vision = body.vision;
  if (body.status) data.status = body.status;
  const ws = await db.workspace.update({ where: { id }, data });
  return NextResponse.json({ workspace: ws });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  await db.workspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
