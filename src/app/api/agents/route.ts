import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listAgentsWithContracts } from "@/lib/agents/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const agents = await listAgentsWithContracts();
  return NextResponse.json({ agents });
}
