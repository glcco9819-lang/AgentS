import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/sessions/[id]/messages */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await db.message.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ messages });
}

/** DELETE /api/sessions/[id]/messages — clear conversation history */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.message.deleteMany({ where: { sessionId: id } });
  return Response.json({ ok: true });
}
