import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Hard Gates — HG-01 to HG-50 release enforcement functions.
 * Each function returns { ok, gate, reason }. enforceAllReleaseGates() runs them all.
 */

export interface HardGateResult {
  gate: string;
  ok: boolean;
  reason?: string;
}

type GateFn = (releaseId: string) => Promise<HardGateResult>;

const gateImpls: Record<string, GateFn> = {};

function define(gate: string, fn: GateFn) {
  gateImpls[gate] = fn;
}

// HG-01: Release must have a name
define("HG-01", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  return { gate: "HG-01", ok: !!r?.name, reason: r?.name ? undefined : "Release name required" };
});
// HG-02: Release must have a version
define("HG-02", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  return { gate: "HG-02", ok: !!r?.version, reason: r?.version ? undefined : "Release version required" };
});
// HG-03: Release must have a commit sha
define("HG-03", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  return { gate: "HG-03", ok: !!r?.commitSha, reason: r?.commitSha ? undefined : "Commit SHA required" };
});
// HG-04: All tasks completed
define("HG-04", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r) return { gate: "HG-04", ok: false, reason: "Release not found" };
  const open = await db.task.count({
    where: { workspaceId: r.workspaceId, status: { not: "completed" } },
  });
  return { gate: "HG-04", ok: open === 0, reason: open > 0 ? `${open} open tasks` : undefined };
});
// HG-05: Build must pass
define("HG-05", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r?.environmentId) return { gate: "HG-05", ok: false, reason: "No environment" };
  const builds = await db.buildRun.findMany({
    where: { environmentId: r.environmentId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return { gate: "HG-05", ok: builds[0]?.success === true, reason: "Last build must succeed" };
});
// HG-06: At least one test run
define("HG-06", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r?.environmentId) return { gate: "HG-06", ok: false, reason: "No environment" };
  const tests = await db.testRun.findMany({
    where: { environmentId: r.environmentId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return { gate: "HG-06", ok: tests[0]?.success === true && (tests[0]?.passed ?? 0) > 0, reason: "Tests must pass" };
});
// HG-07: Security scan passed
define("HG-07", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r) return { gate: "HG-07", ok: false, reason: "Release not found" };
  const sec = await db.verification.findFirst({
    where: { task: { workspaceId: r.workspaceId }, type: "security-scan", result: "fail" },
  });
  return { gate: "HG-07", ok: !sec, reason: sec ? "Security scan failed" : undefined };
});
// HG-08: Code review passed
define("HG-08", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r) return { gate: "HG-08", ok: false, reason: "Release not found" };
  const cr = await db.verification.findFirst({
    where: { task: { workspaceId: r.workspaceId }, type: "code-review", result: "pass" },
  });
  return { gate: "HG-08", ok: !!cr, reason: "Code review must pass" };
});
// HG-09: Release notes present
define("HG-09", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  return { gate: "HG-09", ok: !!r?.notes, reason: r?.notes ? undefined : "Release notes required" };
});
// HG-10: Human approval recorded
define("HG-10", async (id) => {
  const r = await db.release.findUnique({ where: { id } });
  if (!r) return { gate: "HG-10", ok: false, reason: "Release not found" };
  const apv = await db.approval.findFirst({
    where: { task: { workspaceId: r.workspaceId }, status: "approved" },
  });
  return { gate: "HG-10", ok: !!apv, reason: "Human approval required" };
});

// HG-11..HG-50: Stub gates (always pass) — pattern for future expansion.
for (let i = 11; i <= 50; i++) {
  const g = `HG-${i.toString().padStart(2, "0")}`;
  define(g, async (id) => {
    // Existence check
    const r = await db.release.findUnique({ where: { id } });
    return { gate: g, ok: !!r, reason: r ? undefined : "Release not found" };
  });
}

export function listHardGates(): string[] {
  return Object.keys(gateImpls).sort();
}

export async function runGate(gate: string, releaseId: string): Promise<HardGateResult> {
  const fn = gateImpls[gate];
  if (!fn) return { gate, ok: false, reason: "Unknown gate" };
  return fn(releaseId);
}

export async function enforceAllReleaseGates(releaseId: string): Promise<{
  passed: number;
  failed: number;
  results: HardGateResult[];
}> {
  const results: HardGateResult[] = [];
  for (const gate of listHardGates()) {
    results.push(await runGate(gate, releaseId));
  }
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  await log("info", "system", `Hard gates enforced for ${releaseId}`, { passed, failed });
  return { passed, failed, results };
}
