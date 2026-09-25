import { NextRequest, NextResponse } from "next/server";
import { destroySession, extractToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/logout — destroy the current session */
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (token) await destroySession(token);
  return NextResponse.json({ ok: true });
}
