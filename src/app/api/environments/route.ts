import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createEnvironment, listEnvironments } from "@/lib/engineering/sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const envs = await listEnvironments(workspaceId);
  return NextResponse.json({ environments: envs });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !body.name) {
    return NextResponse.json({ error: "workspaceId and name required" }, { status: 400 });
  }
  const env = await createEnvironment({
    workspaceId: body.workspaceId,
    name: body.name,
    repoPath: body.repoPath,
    branch: body.branch,
  });
  return NextResponse.json({ environment: env });
}
