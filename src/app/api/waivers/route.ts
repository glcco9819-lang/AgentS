import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const verificationRunId = url.searchParams.get("verificationRunId") ?? undefined;
  const waivers = await db.waiver.findMany({
    where: verificationRunId ? { verificationRunId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ waivers });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.verificationRunId || !body.reason || !body.approvedBy) {
    return NextResponse.json({ error: "verificationRunId, reason, approvedBy required" }, { status: 400 });
  }
  const waiver = await db.waiver.create({
    data: {
      verificationRunId: body.verificationRunId,
      reason: body.reason,
      approvedBy: body.approvedBy,
      expiresAt: body.expiresAt ?? null,
    },
  });
  return NextResponse.json({ waiver });
}
