import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  try {
    const session = await requireAuth(req);
    const users = await db.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        displayName: u.displayName,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        roles: u.roles.map((r) => r.role.name),
      })),
      currentUser: session.user.username,
    });
  } catch (e) {
    const err = e as { statusCode?: number; message: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 401 });
  }
}
