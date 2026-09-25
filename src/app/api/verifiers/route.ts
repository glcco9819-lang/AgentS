import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listVerifiers, registerVerifier, ensureDefaultVerifiers } from "@/lib/verification/verifier-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const enabledOnly = url.searchParams.get("enabled") === "true";
  const verifiers = await listVerifiers(enabledOnly);
  return NextResponse.json({ verifiers });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.type) {
    return NextResponse.json({ error: "name and type required" }, { status: 400 });
  }
  const v = await registerVerifier(body);
  return NextResponse.json({ verifier: v });
}
