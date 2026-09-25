import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { reviewArchitecture } from "@/lib/analysis/architecture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const result = await reviewArchitecture({
    environmentId: body.environmentId,
    workspaceId: body.workspaceId,
    focus: body.focus,
  });
  return NextResponse.json(result);
}
