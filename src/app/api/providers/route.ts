import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createModelProvider, listProviders } from "@/lib/models/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const providers = await listProviders();
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.baseUrl) {
    return NextResponse.json({ error: "name and baseUrl required" }, { status: 400 });
  }
  const p = await createModelProvider({
    name: body.name,
    baseUrl: body.baseUrl,
    apiKey: body.apiKey,
    enabled: body.enabled ?? true,
  });
  return NextResponse.json({ provider: p });
}
