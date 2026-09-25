import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const p = await db.modelProvider.findUnique({
    where: { id },
    include: { models: true, bindings: true },
  });
  if (!p) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  return NextResponse.json({ provider: p });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.baseUrl) data.baseUrl = body.baseUrl;
  if (typeof body.apiKey === "string") data.apiKey = body.apiKey || null;
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  const p = await db.modelProvider.update({ where: { id }, data });
  return NextResponse.json({ provider: p });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  await db.modelProvider.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
