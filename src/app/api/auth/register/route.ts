import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/register — register a new user */
export async function POST(req: NextRequest) {
  await ensureSeed();
  const { username, password, fullName, email } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "این نام کاربری قبلاً ثبت شده است" }, { status: 409 });
  }
  const viewerRole = await db.role.findUnique({ where: { name: "viewer" } });
  const user = await db.user.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      fullName: fullName ?? null,
      email: email ?? null,
      displayName: username,
      roles: viewerRole ? { create: { roleId: viewerRole.id } } : undefined,
    },
  });
  const token = await createSession(user.id);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      roles: viewerRole ? ["viewer"] : [],
    },
  });
}
