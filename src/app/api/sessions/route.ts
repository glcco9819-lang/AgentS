import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/sessions — list sessions (optionally by project) */
export async function GET(req: NextRequest) {
  await ensureSeed();
  const projectId = req.nextUrl.searchParams.get("projectId");
  const sessions = await db.session.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
    take: 200,
  });
  return Response.json({ sessions });
}

/** POST /api/sessions — create a session */
export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string)?.trim() || "گفت‌وگوی جدید";
  const projectId = body.projectId as string | undefined;
  const session = await db.session.create({ data: { title, projectId: projectId || null } });
  return Response.json({ session }, { status: 201 });
}
