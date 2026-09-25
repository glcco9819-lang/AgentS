import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createPlatformProfile, getPlatformProfile, listPlatformProfiles } from "@/lib/platform/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (workspaceId) {
    const profile = await getPlatformProfile(workspaceId);
    return NextResponse.json({ profile });
  }
  const list = await listPlatformProfiles();
  return NextResponse.json({ profiles: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !Array.isArray(body.targets)) {
    return NextResponse.json({ error: "workspaceId and targets[] required" }, { status: 400 });
  }
  const profile = await createPlatformProfile(body);
  return NextResponse.json({ profile });
}
