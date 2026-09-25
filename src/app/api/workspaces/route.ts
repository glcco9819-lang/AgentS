import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";
import { audit } from "@/lib/governance/audit";
import { refreshProjectState } from "@/lib/project-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true, artifacts: true } } },
  });
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.rootPath) {
    return NextResponse.json({ error: "نام و مسیر ریشه الزامی است" }, { status: 400 });
  }
  const ws = await db.workspace.create({
    data: {
      name: body.name,
      rootPath: body.rootPath,
      language: body.language ?? null,
      framework: body.framework ?? null,
      vision: body.vision ?? null,
      status: "active",
    },
  });
  await refreshProjectState(ws.id);
  await audit({
    workspaceId: ws.id,
    actor: "system",
    action: "workspace.created",
    targetType: "workspace",
    targetId: ws.id,
    meta: { name: ws.name },
  });
  return NextResponse.json({ workspace: ws });
}
