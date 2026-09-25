import { scryptSync, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return scryptSync(password, salt, 64).toString("hex") === hash;
}
export function generateToken(): string { return randomBytes(32).toString("hex"); }

export async function createSession(userId: string, req?: Request): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.userSession.create({ data: { userId, token, expiresAt, ipAddress: req?.headers.get("x-forwarded-for") ?? null, userAgent: req?.headers.get("user-agent") ?? null } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return token;
}
export async function getSession(token: string) {
  if (!token) return null;
  const session = await db.userSession.findUnique({ where: { token }, include: { user: { include: { roles: { include: { role: true } } } } } });
  if (!session) return null;
  if (session.expiresAt < new Date()) { await db.userSession.delete({ where: { id: session.id } }); return null; }
  return session;
}
export async function destroySession(token: string): Promise<void> { await db.userSession.deleteMany({ where: { token } }).catch(() => {}); }

export const PERMISSIONS = {
  WORKSPACE_CREATE: "workspace.create", WORKSPACE_DELETE: "workspace.delete",
  TASK_CREATE: "task.create", TASK_RUN: "task.run", TASK_DELETE: "task.delete",
  APPROVAL_DECIDE: "approval.decide",
  ENV_CREATE: "env.create", ENV_BUILD: "env.build", ENV_SCAN: "env.scan",
  ANALYSIS_RUN: "analysis.run",
  RELEASE_CREATE: "release.create", RELEASE_PUBLISH: "release.publish", RELEASE_ROLLBACK: "release.rollback",
  USER_MANAGE: "user.manage", USER_CREATE: "user.create",
  SETTINGS_EDIT: "settings.edit", PROVIDER_MANAGE: "provider.manage",
  SYSTEM_ADMIN: "system.admin",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLES = [
  { name: "admin", description: "مدیر سیستم — دسترسی کامل", permissions: Object.values(PERMISSIONS), isSystem: true },
  { name: "manager", description: "مدیر پروژه", permissions: [PERMISSIONS.WORKSPACE_CREATE, PERMISSIONS.TASK_CREATE, PERMISSIONS.TASK_RUN, PERMISSIONS.APPROVAL_DECIDE, PERMISSIONS.ENV_CREATE, PERMISSIONS.ENV_SCAN, PERMISSIONS.ANALYSIS_RUN, PERMISSIONS.RELEASE_CREATE, PERMISSIONS.RELEASE_PUBLISH], isSystem: true },
  { name: "engineer", description: "مهندس", permissions: [PERMISSIONS.TASK_CREATE, PERMISSIONS.TASK_RUN, PERMISSIONS.ENV_BUILD, PERMISSIONS.ENV_SCAN, PERMISSIONS.ANALYSIS_RUN], isSystem: true },
  { name: "viewer", description: "مشاهده‌گر", permissions: [], isSystem: true },
];

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const userRoles = await db.userRole.findMany({ where: { userId }, include: { role: true } });
  const perms = new Set<string>();
  for (const ur of userRoles) { (JSON.parse(ur.role.permissions || "[]") as string[]).forEach((p) => perms.add(p)); }
  return perms;
}
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.has(permission) || perms.has(PERMISSIONS.SYSTEM_ADMIN);
}
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookie = req.headers.get("cookie");
  if (cookie) { const match = cookie.match(/(?:^|;\s*)yfg_token=([^;]+)/); if (match) return match[1]; }
  return null;
}
export async function requireAuth(req: Request) {
  const token = extractToken(req);
  if (!token) return null;
  return getSession(token);
}

export async function ensureDefaultUsers() {
  for (const role of DEFAULT_ROLES) {
    const existing = await db.role.findUnique({ where: { name: role.name } });
    if (!existing) await db.role.create({ data: { name: role.name, description: role.description, permissions: JSON.stringify(role.permissions), isSystem: role.isSystem } });
  }
  const userCount = await db.user.count();
  if (userCount === 0) {
    const adminRole = await db.role.findUnique({ where: { name: "admin" } });
    const passwordHash = await hashPassword("admin123");
    const user = await db.user.create({ data: { username: "admin", email: "admin@yfg.local", passwordHash, fullName: "Administrator", displayName: "مدیر سیستم", isActive: true } });
    if (adminRole) await db.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });
    await log("info", "system", "Default admin user created", { username: "admin" });
  }
}
