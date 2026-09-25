import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getProjectState, refreshProjectState, listProjectStates } from "@/lib/project-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (workspaceId) {
    const state = await getProjectState(workspaceId);
    return NextResponse.json({ state });
  }
  const states = await listProjectStates();
  return NextResponse.json({ states });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  const state = await refreshProjectState(body.workspaceId);
  return NextResponse.json({ state });
}
