import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const plugins = await db.plugin.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ plugins });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.kind) {
    return NextResponse.json({ error: "name and kind required" }, { status: 400 });
  }
  const p = await db.plugin.create({
    data: {
      name: body.name,
      kind: body.kind,
      version: body.version ?? "1.0.0",
      enabled: body.enabled ?? true,
      config: body.config ?? null,
    },
  });
  return NextResponse.json({ plugin: p });
}
