import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createToolchain, listToolchains } from "@/lib/engineering/toolchain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const environmentId = url.searchParams.get("environmentId") ?? undefined;
  const list = await listToolchains(environmentId);
  return NextResponse.json({ toolchains: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.environmentId || !body.name || !Array.isArray(body.tools)) {
    return NextResponse.json({ error: "environmentId, name, tools[] required" }, { status: 400 });
  }
  const t = await createToolchain({
    environmentId: body.environmentId,
    name: body.name,
    version: body.version,
    tools: body.tools,
  });
  return NextResponse.json({ toolchain: t });
}
