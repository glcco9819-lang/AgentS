import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/sessions/[id] — session with messages */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await db.session.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } }, project: true },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ session });
}

/** PATCH /api/sessions/[id] — update title / project */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await db.session.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.projectId !== undefined
        ? { projectId: body.projectId || null }
        : {}),
    },
  });
  return Response.json({ session: updated });
}

/** DELETE /api/sessions/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.session.delete({ where: { id } });
  return Response.json({ ok: true });
}
