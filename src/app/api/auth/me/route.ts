import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  try {
    const session = await requireAuth(req);
    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        fullName: session.user.fullName,
        displayName: session.user.displayName,
        roles: session.user.roles.map((r) => r.role.name),
      },
    });
  } catch (e) {
    const err = e as { statusCode?: number; message: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 401 });
  }
}
