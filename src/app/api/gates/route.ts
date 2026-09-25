import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId") ?? undefined;
  const gates = await db.qualityGate.findMany({
    where: taskId ? { taskId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { verification: true },
  });
  return NextResponse.json({ gates });
}
