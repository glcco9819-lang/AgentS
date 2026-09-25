import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";
import { listTasks } from "@/lib/core/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const tasks = await listTasks(workspaceId, status);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const { createAndRunTask } = await import("@/lib/core/orchestrator");
  const result = await createAndRunTask({
    workspaceId: body.workspaceId,
    agentType: body.agentType,
    type: body.type,
    title: body.title,
    input: body.input ?? "",
    context: body.context,
    maxAttempts: body.maxAttempts,
  });
  return NextResponse.json(result);
}
