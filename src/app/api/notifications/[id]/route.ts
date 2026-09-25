import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { markRead } from "@/lib/notifications/engine";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const n = await markRead(id);
  return NextResponse.json({ notification: n });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  await db.notification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
