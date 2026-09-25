import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getDependencyGraph } from "@/lib/intelligence/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const graph = await getDependencyGraph(id);
  return NextResponse.json(graph);
}
