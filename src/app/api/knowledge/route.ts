import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { createKnowledge, searchKnowledge, listKnowledge } from "@/lib/knowledge/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  if (q) {
    const results = await searchKnowledge(q, { workspaceId });
    return NextResponse.json({ results });
  }
  const entries = await listKnowledge(workspaceId);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const entry = await createKnowledge({
    workspaceId: body.workspaceId,
    title: body.title,
    content: body.content,
    kind: body.kind ?? "general",
    tags: body.tags,
  });
  return NextResponse.json({ entry });
}
