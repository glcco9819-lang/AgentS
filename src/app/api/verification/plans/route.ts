import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createVerificationPlan, listVerificationPlans } from "@/lib/verification/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const plans = await listVerificationPlans(workspaceId);
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !Array.isArray(body.checks)) {
    return NextResponse.json({ error: "workspaceId and checks[] required" }, { status: 400 });
  }
  const plan = await createVerificationPlan({
    workspaceId: body.workspaceId,
    taskId: body.taskId,
    releaseId: body.releaseId,
    checks: body.checks,
    riskLevel: body.riskLevel,
  });
  return NextResponse.json({ plan });
}
