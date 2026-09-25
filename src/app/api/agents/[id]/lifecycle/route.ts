import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createAgentVersion, createContractVersion, approveContractVersion, listAgentVersions, listContractVersions } from "@/lib/agents/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "all";
  if (kind === "agent-versions") {
    return NextResponse.json({ versions: await listAgentVersions(id) });
  }
  if (kind === "contract-versions") {
    return NextResponse.json({ versions: await listContractVersions(id) });
  }
  const [av, cv] = await Promise.all([listAgentVersions(id), listContractVersions(id)]);
  return NextResponse.json({ agentVersions: av, contractVersions: cv });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "create-agent-version") {
    const v = await createAgentVersion({
      agentId: id,
      version: body.version,
      changes: body.changes,
      active: body.active,
    });
    return NextResponse.json({ version: v });
  }
  if (body.action === "create-contract-version") {
    const v = await createContractVersion({
      agentId: id,
      version: body.version,
      capabilities: body.capabilities ?? "[]",
      permissions: body.permissions ?? "[]",
      tools: body.tools ?? "[]",
      models: body.models,
      changeReason: body.changeReason,
    });
    return NextResponse.json({ version: v });
  }
  if (body.action === "approve-contract") {
    const v = await approveContractVersion(body.contractVersionId, body.approvedBy ?? "system");
    return NextResponse.json({ version: v });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
