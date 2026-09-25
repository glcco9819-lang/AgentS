import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createWorkflow, listWorkflows } from "@/lib/orchestration/workflow-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const list = await listWorkflows(workspaceId);
  return NextResponse.json({ workflows: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !Array.isArray(body.steps)) {
    return NextResponse.json({ error: "name and steps[] required" }, { status: 400 });
  }
  const wf = await createWorkflow({
    workspaceId: body.workspaceId,
    name: body.name,
    description: body.description,
    steps: body.steps,
  });
  return NextResponse.json({ workflow: wf });
}
