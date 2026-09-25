import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";
import { runVerification } from "@/lib/verification/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId") ?? undefined;
  const verifications = await db.verification.findMany({
    where: taskId ? { taskId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ verifications });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.taskId || !body.artifactId || !body.type) {
    return NextResponse.json({ error: "taskId, artifactId, type الزامی است" }, { status: 400 });
  }
  const art = await db.artifact.findUnique({ where: { id: body.artifactId } });
  if (!art) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  const result = await runVerification({
    taskId: body.taskId,
    artifactId: body.artifactId,
    type: body.type,
    content: art.content,
    agentId: body.agentId,
  });
  return NextResponse.json(result);
}
