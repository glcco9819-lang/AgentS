import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createEvidenceBundle, listEvidenceBundles, sealBundle } from "@/lib/verification/evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const bundles = await listEvidenceBundles(workspaceId);
  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.workspaceId || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "workspaceId and items[] required" }, { status: 400 });
  }
  const bundle = await createEvidenceBundle({
    workspaceId: body.workspaceId,
    releaseId: body.releaseId,
    taskId: body.taskId,
    items: body.items,
  });
  return NextResponse.json({ bundle });
}

export async function PATCH(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.bundleId) return NextResponse.json({ error: "bundleId required" }, { status: 400 });
  const r = await sealBundle(body.bundleId);
  return NextResponse.json(r);
}
