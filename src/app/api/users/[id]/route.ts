import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  try {
    await requireAuth(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.fullName === "string") data.fullName = body.fullName;
    if (typeof body.displayName === "string") data.displayName = body.displayName;
    if (typeof body.email === "string") data.email = body.email;
    if (typeof body.password === "string" && body.password) data.passwordHash = hashPassword(body.password);
    if (Array.isArray(body.roles)) {
      // Replace roles
      await db.userRole.deleteMany({ where: { userId: id } });
      for (const roleName of body.roles as string[]) {
        const role = await db.role.findUnique({ where: { name: roleName } });
        if (role) {
          await db.userRole.create({ data: { userId: id, roleId: role.id } }).catch(() => {});
        }
      }
    }
    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, user: { id: user.id } });
  } catch (e) {
    const err = e as { statusCode?: number; message: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  try {
    await requireAuth(req);
    const { id } = await params;
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { statusCode?: number; message: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 400 });
  }
}
