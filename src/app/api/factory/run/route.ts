import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { runFactory } from "@/lib/factory/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !body.title || !body.requirement) {
    return NextResponse.json({ error: "workspaceId, title, requirement required" }, { status: 400 });
  }
  const result = await runFactory({
    workspaceId: body.workspaceId,
    title: body.title,
    requirement: body.requirement,
  });
  return NextResponse.json(result);
}
