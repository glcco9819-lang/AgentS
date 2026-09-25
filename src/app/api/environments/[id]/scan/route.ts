import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { scanEnvironment } from "@/lib/intelligence/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const result = await scanEnvironment(id);
  return NextResponse.json(result);
}
