import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Toolchain — declared set of tools for an environment.
 * Validates agent tool access against declared toolchains.
 */

export async function createToolchain(input: {
  environmentId: string;
  name: string;
  version?: string;
  tools: string[];
}) {
  const t = await db.toolchain.create({
    data: {
      environmentId: input.environmentId,
      name: input.name,
      version: input.version ?? "1.0.0",
      tools: JSON.stringify(input.tools),
    },
  });
  await log("info", "system", `Toolchain ${t.name} created for env ${input.environmentId}`);
  return t;
}

export async function listToolchains(environmentId?: string) {
  return db.toolchain.findMany({
    where: environmentId ? { environmentId } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function validateToolAccess(environmentId: string, tool: string): Promise<boolean> {
  const chains = await db.toolchain.findMany({ where: { environmentId } });
  for (const c of chains) {
    try {
      const tools = JSON.parse(c.tools) as string[];
      if (tools.includes(tool)) return true;
    } catch {
      // ignore
    }
  }
  return false;
}
