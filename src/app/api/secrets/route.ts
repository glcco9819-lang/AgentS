import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createSecretReference, resolveSecret, listSecretReferences } from "@/lib/engineering/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const environmentId = url.searchParams.get("environmentId") ?? undefined;
  const list = await listSecretReferences(workspaceId, environmentId);
  return NextResponse.json({ secrets: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.secretType || !body.reference) {
    return NextResponse.json({ error: "name, secretType, reference required" }, { status: 400 });
  }
  const ref = await createSecretReference({
    workspaceId: body.workspaceId,
    environmentId: body.environmentId,
    name: body.name,
    secretType: body.secretType,
    reference: body.reference,
    requiredBy: body.requiredBy,
  });
  return NextResponse.json({ secret: ref });
}

export async function PATCH(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const reference = await resolveSecret(body.name);
  return NextResponse.json({ reference });
}
