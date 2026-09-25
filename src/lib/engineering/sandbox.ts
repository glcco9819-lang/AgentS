import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { initRepo } from "@/lib/engineering/git";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

/**
 * Engineering sandbox — manages per-workspace git environments on disk.
 */

const REPO_ROOT = process.env.YFG_REPO_ROOT || "/tmp/yfg-envs";

export function ensureRepoRoot(): string {
  if (!existsSync(REPO_ROOT)) mkdirSync(REPO_ROOT, { recursive: true });
  return REPO_ROOT;
}

export function getRepoPath(envId: string): string {
  return join(ensureRepoRoot(), envId);
}

export async function createEnvironment(input: {
  workspaceId: string;
  name: string;
  repoPath?: string;
  branch?: string;
}) {
  const env = await db.environment.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      repoPath: input.repoPath || "",
      branch: input.branch || "main",
      status: "ready",
    },
  });
  // Bootstrap a real git repo for this env on disk
  const repoPath = getRepoPath(env.id);
  if (!input.repoPath) {
    initRepo(repoPath);
    await db.environment.update({
      where: { id: env.id },
      data: { repoPath },
    });
  }
  await log("info", "system", `Environment ${env.id} created`, {
    workspaceId: input.workspaceId,
    repoPath,
  });
  return { ...env, repoPath };
}

export async function listEnvironments(workspaceId?: string) {
  return db.environment.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { commits: { take: 5, orderBy: { createdAt: "desc" } } },
  });
}

export async function recordExecution(input: {
  environmentId: string;
  agentId?: string;
  command: string;
  args?: string;
  cwd?: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
  approved?: boolean;
  approvedBy?: string;
}) {
  return db.commandExecution.create({
    data: {
      environmentId: input.environmentId,
      agentId: input.agentId ?? null,
      command: input.command,
      args: input.args ?? null,
      cwd: input.cwd ?? null,
      exitCode: input.exitCode,
      stdout: input.stdout ?? null,
      stderr: input.stderr ?? null,
      durationMs: input.durationMs,
      approved: input.approved ?? false,
      approvedBy: input.approvedBy ?? null,
    },
  });
}
