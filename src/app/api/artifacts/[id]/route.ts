import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const artifact = await db.artifact.findUnique({
    where: { id },
    include: { verifications: true },
  });
  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  return NextResponse.json({ artifact });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  await db.artifact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
