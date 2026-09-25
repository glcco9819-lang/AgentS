import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { runWorkflow } from "@/lib/orchestration/workflow-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  const result = await runWorkflow({
    workflowId: id,
    workspaceId: body.workspaceId,
    resumeFromStep: body.resumeFromStep,
  });
  return NextResponse.json(result);
}
