import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { runBuild, runTests } from "@/lib/engineering/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "test") {
    const r = await runTests(id, body.command ?? "npm test");
    return NextResponse.json(r);
  }
  // default: build
  const r = await runBuild(id, body.command ?? "npm run build");
  return NextResponse.json(r);
}
