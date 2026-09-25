import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Verifier Registry — pluggable verifiers, registered by name.
 */

export interface VerifierDef {
  name: string;
  type: string;
  version?: string;
  contract?: string;
  enabled?: boolean;
}

const DEFAULT_VERIFIERS: VerifierDef[] = [
  { name: "syntax-checker", type: "syntax", version: "1.0.0" },
  { name: "lint-basic", type: "lint", version: "1.0.0" },
  { name: "unit-test-runner", type: "unit-test", version: "1.0.0" },
  { name: "type-checker", type: "type-check", version: "1.0.0" },
  { name: "code-review-ai", type: "code-review", version: "1.0.0" },
  { name: "security-scanner", type: "security-scan", version: "1.0.0" },
  { name: "coverage-reporter", type: "coverage", version: "1.0.0" },
  { name: "build-verifier", type: "build", version: "1.0.0" },
];

export async function registerVerifier(def: VerifierDef) {
  const v = await db.verifier.upsert({
    where: { name: def.name },
    update: {
      type: def.type,
      version: def.version ?? "1.0.0",
      contract: def.contract ?? null,
      enabled: def.enabled ?? true,
    },
    create: {
      name: def.name,
      type: def.type,
      version: def.version ?? "1.0.0",
      contract: def.contract ?? null,
      enabled: def.enabled ?? true,
    },
  });
  await log("info", "system", `Verifier registered: ${def.name}`);
  return v;
}

export async function listVerifiers(enabledOnly = false) {
  return db.verifier.findMany({
    where: enabledOnly ? { enabled: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function ensureDefaultVerifiers() {
  for (const def of DEFAULT_VERIFIERS) {
    await registerVerifier(def);
  }
}
