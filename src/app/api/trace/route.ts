import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { fullChain, listTraceLinks, linkTrace } from "@/lib/traceability/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;
  const id = url.searchParams.get("id") ?? undefined;
  if (workspaceId && type && id) {
    const chain = await fullChain({ workspaceId, type, id });
    return NextResponse.json(chain);
  }
  const links = await listTraceLinks(workspaceId);
  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !body.sourceType || !body.sourceId || !body.targetType || !body.targetId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const link = await linkTrace({
    workspaceId: body.workspaceId,
    sourceType: body.sourceType,
    sourceId: body.sourceId,
    targetType: body.targetType,
    targetId: body.targetId,
    relation: body.relation ?? "links",
    taskId: body.taskId,
  });
  return NextResponse.json({ link });
}
