import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listHandoffPackages, createHandoffPackage, validateHandoff } from "@/lib/orchestration/handoff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId") ?? undefined;
  const list = await listHandoffPackages(taskId);
  return NextResponse.json({ packages: list });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });
  const hp = await createHandoffPackage(body);
  return NextResponse.json({ package: hp });
}

export async function PATCH(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const r = await validateHandoff(body.id);
  return NextResponse.json(r);
}
