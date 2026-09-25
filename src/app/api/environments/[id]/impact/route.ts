import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { impactAnalysis } from "@/lib/intelligence/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.changedPath) {
    return NextResponse.json({ error: "changedPath required" }, { status: 400 });
  }
  const result = await impactAnalysis(id, body.changedPath);
  return NextResponse.json(result);
}
