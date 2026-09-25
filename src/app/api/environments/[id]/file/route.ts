import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { writeFile, readFile } from "@/lib/engineering/git";
import { getRepoPath } from "@/lib/engineering/sandbox";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
  const env = await db.environment.findUnique({ where: { id } });
  if (!env) return NextResponse.json({ error: "Env not found" }, { status: 404 });
  const repoPath = env.repoPath || getRepoPath(id);
  const content = readFile(repoPath, path);
  if (content === null) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.json({ path, content });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.path || typeof body.content !== "string") {
    return NextResponse.json({ error: "path and content required" }, { status: 400 });
  }
  const env = await db.environment.findUnique({ where: { id } });
  if (!env) return NextResponse.json({ error: "Env not found" }, { status: 404 });
  const repoPath = env.repoPath || getRepoPath(id);
  writeFile(repoPath, body.path, body.content);
  return NextResponse.json({ ok: true, path: body.path });
}
