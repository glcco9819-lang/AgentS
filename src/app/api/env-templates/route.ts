import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listTemplates, ensureDefaultTemplates } from "@/lib/engineering/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const templates = await listTemplates();
  return NextResponse.json({ templates });
}

export async function POST() {
  await ensureSeed();
  await ensureDefaultTemplates();
  return NextResponse.json({ ok: true });
}
