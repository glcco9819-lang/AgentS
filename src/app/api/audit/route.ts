import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getAuditTrail, verifyAuditChain } from "@/lib/governance/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "200", 10);
  const verify = url.searchParams.get("verify") === "true";
  if (verify) {
    const result = await verifyAuditChain(workspaceId);
    return NextResponse.json(result);
  }
  const trail = await getAuditTrail(workspaceId, limit);
  return NextResponse.json({ trail });
}
