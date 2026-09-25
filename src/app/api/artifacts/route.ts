import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
  const taskId = url.searchParams.get("taskId") ?? undefined;
  const artifacts = await db.artifact.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(taskId ? { taskId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ artifacts });
}
