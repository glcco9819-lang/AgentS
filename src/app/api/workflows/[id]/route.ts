import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getWorkflow, pauseWorkflow, resumeWorkflow } from "@/lib/orchestration/workflow-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const wf = await getWorkflow(id);
  if (!wf) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json({ workflow: wf });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "pause") {
    return NextResponse.json({ run: await pauseWorkflow(body.runId ?? id) });
  }
  if (body.action === "resume") {
    return NextResponse.json({ run: await resumeWorkflow(body.runId ?? id) });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
