import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Environment Templates — predefined platform/runtime configurations.
 */

export interface EnvTemplateSeed {
  name: string;
  platform: string;
  baseImage?: string;
  tools: string[];
  runtimes?: string[];
  sdks?: string[];
  envVars?: Record<string, string>;
}

export const DEFAULT_ENV_TEMPLATES: EnvTemplateSeed[] = [
  {
    name: "node-bun",
    platform: "linux",
    baseImage: "oven/bun:latest",
    tools: ["bun", "git", "tsc"],
    runtimes: ["node20", "bun1"],
    sdks: ["typescript5"],
  },
  {
    name: "python-poetry",
    platform: "linux",
    baseImage: "python:3.12",
    tools: ["python", "poetry", "pytest", "git"],
    runtimes: ["python3.12"],
    sdks: ["python"],
  },
  {
    name: "go",
    platform: "linux",
    baseImage: "golang:1.22",
    tools: ["go", "git"],
    runtimes: ["go1.22"],
  },
  {
    name: "dotnet",
    platform: "linux",
    baseImage: "mcr.microsoft.com/dotnet/sdk:8.0",
    tools: ["dotnet", "git"],
    runtimes: ["dotnet8"],
  },
];

export async function createTemplate(input: EnvTemplateSeed) {
  const t = await db.environmentTemplate.create({
    data: {
      name: input.name,
      platform: input.platform,
      baseImage: input.baseImage ?? null,
      tools: JSON.stringify(input.tools),
      runtimes: input.runtimes ? JSON.stringify(input.runtimes) : null,
      sdks: input.sdks ? JSON.stringify(input.sdks) : null,
      envVars: input.envVars ? JSON.stringify(input.envVars) : null,
    },
  });
  await log("info", "system", `Environment template ${t.name} created`);
  return t;
}

export async function listTemplates() {
  return db.environmentTemplate.findMany({ orderBy: { name: "asc" } });
}

export async function ensureDefaultTemplates() {
  for (const t of DEFAULT_ENV_TEMPLATES) {
    const exists = await db.environmentTemplate.findUnique({ where: { name: t.name } });
    if (!exists) await createTemplate(t);
  }
}
