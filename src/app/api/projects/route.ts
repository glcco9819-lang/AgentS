import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/projects */
export async function GET() {
  await ensureSeed();
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sessions: true, fileIndex: true } } },
  });
  return Response.json({ projects });
}

/** POST /api/projects — register a new project (scanning comes in V0.2) */
export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  const rootPath = (body.rootPath as string)?.trim();
  if (!name || !rootPath) {
    return Response.json({ error: "name and rootPath are required" }, { status: 400 });
  }
  const project = await db.project.create({
    data: {
      name,
      rootPath,
      language: body.language ?? null,
      framework: body.framework ?? null,
      note: body.note ?? null,
      status: "registered",
    },
  });
  await log("info", "project", "Project registered", { id: project.id, name, rootPath });
  return Response.json({ project }, { status: 201 });
}
