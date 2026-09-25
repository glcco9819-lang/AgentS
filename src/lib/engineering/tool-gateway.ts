import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { execute } from "@/lib/engineering/runner";
import { recordExecution } from "@/lib/engineering/sandbox";

/**
 * Tool Gateway — single entry point for executing shell commands on behalf
 * of agents. Enforces the runner whitelist + records every execution.
 */

export async function executeCommand(input: {
  environmentId: string;
  agentId?: string;
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
  approved?: boolean;
  approvedBy?: string;
}) {
  const t0 = Date.now();
  const r = execute(input.command, {
    cwd: input.cwd,
    args: input.args,
    timeout: input.timeout,
  });
  await recordExecution({
    environmentId: input.environmentId,
    agentId: input.agentId,
    command: input.command,
    args: input.args?.join(" "),
    cwd: input.cwd,
    exitCode: r.exitCode,
    stdout: r.stdout,
    stderr: r.stderr,
    durationMs: r.durationMs,
    approved: input.approved ?? false,
    approvedBy: input.approvedBy,
  });
  await log(r.success ? "info" : "warn", "system", `Command executed: ${input.command}`, {
    environmentId: input.environmentId,
    exitCode: r.exitCode,
    durationMs: r.durationMs,
  });
  return r;
}

export async function listCommandExecutions(environmentId?: string, limit = 100) {
  return db.commandExecution.findMany({
    where: environmentId ? { environmentId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
