import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";

/**
 * Policy engine — evaluate simple rule-based policies and seed defaults.
 */

export interface PolicyDefinition {
  name: string;
  rule: string;
  scope: string;
  enabled?: boolean;
}

export const DEFAULT_POLICIES: PolicyDefinition[] = [
  { name: "no-secrets-in-artifacts", rule: "forbid('AKIA[0-9A-Z]{16}')", scope: "artifact", enabled: true },
  { name: "min-test-coverage", rule: "coverage >= 60", scope: "release", enabled: true },
  { name: "require-human-approval-for-production", rule: "gate.requiresHuman === true", scope: "release", enabled: true },
  { name: "max-task-retries", rule: "task.attempt <= task.maxAttempts", scope: "task", enabled: true },
  { name: "no-direct-db-in-controller", rule: "forbid('controller.*.sql')", scope: "artifact", enabled: true },
  { name: "code-review-required", rule: "verification.type === 'code-review'", scope: "task", enabled: true },
  { name: "build-must-pass", rule: "build.success === true", scope: "release", enabled: true },
  { name: "trace-required", rule: "trace.count >= 1", scope: "task", enabled: true },
];

export async function ensureDefaultPolicies(): Promise<void> {
  for (const p of DEFAULT_POLICIES) {
    await db.policy.upsert({
      where: { name: p.name },
      update: { rule: p.rule, scope: p.scope, enabled: p.enabled ?? true },
      create: {
        name: p.name,
        rule: p.rule,
        scope: p.scope,
        enabled: p.enabled ?? true,
      },
    });
  }
  await log("info", "system", `Default policies ensured (${DEFAULT_POLICIES.length})`);
}

export interface PolicyEvalContext {
  scope: string;
  data: Record<string, unknown>;
}

export interface PolicyEvalResult {
  policyName: string;
  passed: boolean;
  reason: string;
}

export async function evaluatePolicies(ctx: PolicyEvalContext): Promise<PolicyEvalResult[]> {
  const policies = await db.policy.findMany({
    where: { scope: ctx.scope, enabled: true },
  });
  const results: PolicyEvalResult[] = [];
  for (const p of policies) {
    // Best-effort rule evaluation. Real implementations would compile DSL → fn.
    let passed = true;
    let reason = "OK";
    try {
      const rule = p.rule;
      if (rule.startsWith("coverage >=")) {
        const threshold = parseInt(rule.split(">=")[1].trim(), 10);
        const actual = Number(ctx.data.coverage ?? 100);
        passed = actual >= threshold;
        if (!passed) reason = `coverage ${actual}% < ${threshold}%`;
      } else if (rule.startsWith("gate.requiresHuman")) {
        passed = Boolean(ctx.data.requiresHuman);
        if (!passed) reason = "human approval not configured";
      } else if (rule.startsWith("task.attempt <=")) {
        const attempt = Number(ctx.data.attempt ?? 1);
        const max = Number(ctx.data.maxAttempts ?? 3);
        passed = attempt <= max;
        if (!passed) reason = `attempt ${attempt} > max ${max}`;
      } else if (rule.startsWith("forbid(")) {
        const m = rule.match(/forbid\(['"](.+?)['"]\)/);
        if (m) {
          const re = new RegExp(m[1]);
          const text = String(ctx.data.text ?? "");
          passed = !re.test(text);
          if (!passed) reason = `forbidden pattern found in content`;
        }
      } else if (rule.startsWith("verification.type")) {
        passed = String(ctx.data.verificationType ?? "") === "code-review";
        if (!passed) reason = "code-review verification required";
      } else if (rule.startsWith("build.success")) {
        passed = ctx.data.buildSuccess === true;
        if (!passed) reason = "build did not pass";
      } else if (rule.startsWith("trace.count")) {
        const tc = Number(ctx.data.traceCount ?? 1);
        passed = tc >= 1;
        if (!passed) reason = "no trace links";
      }
    } catch (e) {
      passed = false;
      reason = (e as Error).message;
    }
    results.push({ policyName: p.name, passed, reason });
  }
  return results;
}
