import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/projects/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.project.delete({ where: { id } });
  await log("info", "project", "Project deleted", { id });
  return Response.json({ ok: true });
}
