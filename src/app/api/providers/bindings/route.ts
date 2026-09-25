import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { selectModel } from "@/lib/models/registry";
import { bindAgentToProvider } from "@/lib/ai/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  // Use gateway's getProviders which returns ModelProvider[]
  const { getProviders } = await import("@/lib/ai/gateway");
  const providers = await getProviders();
  // Build binding matrix
  const { db } = await import("@/lib/db");
  const bindings = await db.agentModelBinding.findMany({ include: { provider: true } });
  return NextResponse.json({ providers, bindings });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.agentId || !body.providerId) {
    return NextResponse.json({ error: "agentId and providerId required" }, { status: 400 });
  }
  const binding = await bindAgentToProvider({
    agentId: body.agentId,
    providerId: body.providerId,
    modelName: body.modelName,
  });
  // Also update via models/registry for symmetry
  await selectModel({
    agentId: body.agentId,
    providerId: body.providerId,
    modelName: body.modelName,
  });
  return NextResponse.json({ binding });
}
