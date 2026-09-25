import { spawnSync } from "child_process";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { recordExecution } from "@/lib/engineering/sandbox";

/**
 * Build & test runner — command whitelist + execution recording.
 */

const ALLOWED_COMMANDS = new Set([
  "bun",
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "node",
  "tsc",
  "eslint",
  "prettier",
  "jest",
  "vitest",
  "pytest",
  "go",
  "cargo",
  "git",
  "ls",
  "cat",
  "echo",
  "mkdir",
  "rm",
  "cp",
  "mv",
]);

export function isAllowed(command: string): boolean {
  const base = command.split(" ")[0];
  return ALLOWED_COMMANDS.has(base);
}

export interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export function execute(command: string, opts?: { cwd?: string; args?: string[]; timeout?: number }): RunResult {
  if (!isAllowed(command)) {
    return { success: false, stdout: "", stderr: "Command not in whitelist", exitCode: -1, durationMs: 0 };
  }
  const parts = command.split(/\s+/);
  const bin = parts[0];
  const args = [...parts.slice(1), ...(opts?.args ?? [])];
  const t0 = Date.now();
  try {
    const result = spawnSync(bin, args, {
      cwd: opts?.cwd,
      encoding: "utf-8",
      timeout: opts?.timeout ?? 60000,
      maxBuffer: 1024 * 1024 * 8,
    });
    return {
      success: result.status === 0,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.status ?? -1,
      durationMs: Date.now() - t0,
    };
  } catch (e) {
    return { success: false, stdout: "", stderr: (e as Error).message, exitCode: -1, durationMs: Date.now() - t0 };
  }
}

export async function runBuild(environmentId: string, command = "npm run build"): Promise<RunResult & { id: string }> {
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) throw new Error("Environment not found");
  const r = execute(command, { cwd: env.repoPath });
  const row = await db.buildRun.create({
    data: {
      environmentId,
      command,
      success: r.success,
      output: r.stdout + (r.stderr ? `\n--- STDERR ---\n${r.stderr}` : ""),
      durationMs: r.durationMs,
    },
  });
  await recordExecution({
    environmentId,
    command,
    exitCode: r.exitCode,
    stdout: r.stdout,
    stderr: r.stderr,
    durationMs: r.durationMs,
    approved: true,
    approvedBy: "system",
  });
  await log(r.success ? "info" : "error", "system", `Build ${r.success ? "OK" : "FAILED"}`, {
    environmentId,
    durationMs: r.durationMs,
  });
  return { ...r, id: row.id };
}

export async function runTests(environmentId: string, command = "npm test"): Promise<RunResult & { id: string }> {
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) throw new Error("Environment not found");
  const r = execute(command, { cwd: env.repoPath });
  // Parse simple "X passing, Y failing" output (jest/vitest style)
  let passed = 0;
  let failed = 0;
  const passMatch = r.stdout.match(/(\d+)\s+passing/);
  const failMatch = r.stdout.match(/(\d+)\s+failing/);
  if (passMatch) passed = parseInt(passMatch[1], 10);
  if (failMatch) failed = parseInt(failMatch[1], 10);
  const row = await db.testRun.create({
    data: {
      environmentId,
      command,
      success: r.success,
      passed,
      failed,
      output: r.stdout + (r.stderr ? `\n--- STDERR ---\n${r.stderr}` : ""),
      durationMs: r.durationMs,
    },
  });
  await recordExecution({
    environmentId,
    command,
    exitCode: r.exitCode,
    stdout: r.stdout,
    stderr: r.stderr,
    durationMs: r.durationMs,
    approved: true,
    approvedBy: "system",
  });
  await log(r.success ? "info" : "error", "system", `Tests ${r.success ? "OK" : "FAILED"}`, {
    environmentId,
    passed,
    failed,
  });
  return { ...r, id: row.id };
}
