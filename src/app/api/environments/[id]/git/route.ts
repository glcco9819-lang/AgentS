import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { getStatus, createBranch, commit } from "@/lib/engineering/git";
import { getRepoPath } from "@/lib/engineering/sandbox";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const env = await db.environment.findUnique({ where: { id: id } });
  if (!env) return NextResponse.json({ error: "Env not found" }, { status: 404 });
  const repoPath = env.repoPath || getRepoPath(id);
  const status = getStatus(repoPath);
  return NextResponse.json({ status: status.stdout, env });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const env = await db.environment.findUnique({ where: { id } });
  if (!env) return NextResponse.json({ error: "Env not found" }, { status: 404 });
  const repoPath = env.repoPath || getRepoPath(id);
  if (body.action === "branch" && body.name) {
    const r = createBranch(repoPath, body.name);
    await db.environment.update({ where: { id }, data: { branch: body.name } });
    return NextResponse.json({ ok: r.success, stderr: r.stderr });
  }
  if (body.action === "commit" && body.message) {
    const r = commit(repoPath, body.message, body.author);
    if (r.sha) {
      await db.environment.update({
        where: { id },
        data: {
          commits: {
            create: {
              sha: r.sha,
              message: body.message,
              author: body.author ?? "yfg-bot",
              filesChanged: body.filesChanged ?? 1,
            },
          },
        },
      });
    }
    return NextResponse.json({ ok: r.success, sha: r.sha, stderr: r.stderr });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
