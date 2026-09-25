import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { requestApproval, decideApproval, listApprovals, pendingApprovals } from "@/lib/governance/approval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const pending = url.searchParams.get("pending") === "true";
  const approvals = pending ? await pendingApprovals() : await listApprovals();
  return NextResponse.json({ approvals });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (body.approvalId && body.decision) {
    // Decide an existing approval
    const result = await decideApproval({
      approvalId: body.approvalId,
      decision: body.decision,
      decidedBy: body.decidedBy ?? "system",
      comment: body.comment,
    });
    return NextResponse.json({ approval: result });
  }
  // Otherwise request a new approval
  if (!body.taskId || !body.gateType) {
    return NextResponse.json({ error: "taskId and gateType required" }, { status: 400 });
  }
  const approval = await requestApproval({
    taskId: body.taskId,
    gateType: body.gateType,
    requestedBy: body.requestedBy,
    comment: body.comment,
  });
  return NextResponse.json({ approval });
}
