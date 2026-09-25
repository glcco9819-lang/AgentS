import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { evaluateGateMatrix } from "@/lib/verification/gate-matrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId") ?? undefined;
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const result = await evaluateGateMatrix({ taskId, workspaceId });
  return NextResponse.json(result);
}
