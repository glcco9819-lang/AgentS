import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { enforceAllReleaseGates, listHardGates } from "@/lib/governance/hard-gates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  return NextResponse.json({ gates: listHardGates() });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.releaseId) {
    return NextResponse.json({ error: "releaseId required" }, { status: 400 });
  }
  const result = await enforceAllReleaseGates(body.releaseId);
  return NextResponse.json(result);
}
