import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Secret References — references (not values) for secrets used by envs/tasks.
 */

export async function createSecretReference(input: {
  workspaceId?: string;
  environmentId?: string;
  name: string;
  secretType: string;
  reference: string;
  requiredBy?: string;
}) {
  const ref = await db.secretReference.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      environmentId: input.environmentId ?? null,
      name: input.name,
      secretType: input.secretType,
      reference: input.reference,
      requiredBy: input.requiredBy ?? null,
    },
  });
  await log("info", "system", `Secret reference ${ref.name} created`, {
    secretType: ref.secretType,
  });
  return ref;
}

export async function resolveSecret(name: string): Promise<string | null> {
  const ref = await db.secretReference.findFirst({ where: { name } });
  if (!ref) return null;
  // For safety, we return the *reference* (e.g., env-var name or path), never the secret value.
  return ref.reference;
}

export async function listSecretReferences(workspaceId?: string, environmentId?: string) {
  return db.secretReference.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(environmentId ? { environmentId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}
