import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const adapters = await db.adapter.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ adapters });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.kind || !body.config) {
    return NextResponse.json({ error: "name, kind, config required" }, { status: 400 });
  }
  const a = await db.adapter.create({
    data: {
      name: body.name,
      kind: body.kind,
      config: typeof body.config === "string" ? body.config : JSON.stringify(body.config),
      enabled: body.enabled ?? false,
    },
  });
  return NextResponse.json({ adapter: a });
}
