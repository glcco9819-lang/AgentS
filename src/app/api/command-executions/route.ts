import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listCommandExecutions } from "@/lib/engineering/tool-gateway";
import { executeCommand } from "@/lib/engineering/tool-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const environmentId = url.searchParams.get("environmentId") ?? undefined;
  const list = await listCommandExecutions(environmentId);
  return NextResponse.json({ executions: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.environmentId || !body.command) {
    return NextResponse.json({ error: "environmentId and command required" }, { status: 400 });
  }
  const result = await executeCommand({
    environmentId: body.environmentId,
    agentId: body.agentId,
    command: body.command,
    args: body.args,
    cwd: body.cwd,
    timeout: body.timeout,
    approved: body.approved ?? true,
    approvedBy: body.approvedBy ?? "system",
  });
  return NextResponse.json(result);
}
