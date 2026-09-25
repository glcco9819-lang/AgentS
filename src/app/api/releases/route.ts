import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createRelease, listReleases } from "@/lib/release/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const releases = await listReleases(workspaceId);
  return NextResponse.json({ releases });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !body.version || !body.name) {
    return NextResponse.json({ error: "workspaceId, version, name required" }, { status: 400 });
  }
  const release = await createRelease({
    workspaceId: body.workspaceId,
    environmentId: body.environmentId,
    version: body.version,
    name: body.name,
    notes: body.notes,
    commitSha: body.commitSha,
  });
  return NextResponse.json({ release });
}
