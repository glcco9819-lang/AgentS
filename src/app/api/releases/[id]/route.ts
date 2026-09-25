import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getRelease, verifyRelease, approveRelease, publishRelease, rollbackRelease } from "@/lib/release/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const release = await getRelease(id);
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });
  return NextResponse.json({ release });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "verify") {
    const r = await verifyRelease(id);
    return NextResponse.json(r);
  }
  if (body.action === "approve") {
    const r = await approveRelease(id, body.approvedBy ?? "system");
    return NextResponse.json(r);
  }
  if (body.action === "publish") {
    const r = await publishRelease(id, body.publishedBy ?? "system");
    return NextResponse.json(r);
  }
  if (body.action === "rollback") {
    const r = await rollbackRelease(id, body.rolledBackBy ?? "system");
    return NextResponse.json(r);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
