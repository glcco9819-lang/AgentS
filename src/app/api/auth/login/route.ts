import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, getSession, destroySession, extractToken } from "@/lib/auth";
import { ensureSeed } from "@/lib/init";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/login — username/password → session token */
export async function POST(req: NextRequest) {
  await ensureSeed();
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
  }
  const user = await db.user.findUnique({
    where: { username },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور نادرست است" }, { status: 401 });
  }
  const { token } = await createSession(user.id, {
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await log("info", "system", `User ${username} logged in`);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      roles: user.roles.map((r) => r.role.name),
    },
  });
}

/** GET /api/auth/me — current user from token */
export async function GET(req: NextRequest) {
  await ensureSeed();
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "نشست نامعتبر" }, { status: 401 });
  return NextResponse.json({
    user: {
      id: session.user.id,
      username: session.user.username,
      fullName: session.user.fullName,
      displayName: session.user.displayName,
      roles: session.user.roles.map((r) => r.role.name),
    },
  });
}

/** DELETE /api/auth/logout */
export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  if (token) await destroySession(token);
  return NextResponse.json({ ok: true });
}
