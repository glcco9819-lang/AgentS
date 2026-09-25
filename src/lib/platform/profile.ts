import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Platform Profile — multi-platform target definitions per workspace.
 */

export async function createPlatformProfile(input: {
  workspaceId: string;
  targets: Array<{ platform: string; osVersions?: string; techStack?: string; uiFramework?: string; priority?: number }>;
  architecture?: string;
  constraints?: string;
  runtimeReqs?: string;
  distMethod?: string;
}) {
  const profile = await db.platformProfile.create({
    data: {
      workspaceId: input.workspaceId,
      targets: JSON.stringify(input.targets.map((t) => t.platform)),
      architecture: input.architecture ?? null,
      constraints: input.constraints ?? null,
      runtimeReqs: input.runtimeReqs ?? null,
      distMethod: input.distMethod ?? null,
    },
  });
  for (const t of input.targets) {
    await db.platformTarget.create({
      data: {
        profileId: profile.id,
        platform: t.platform,
        osVersions: t.osVersions ?? null,
        techStack: t.techStack ?? null,
        uiFramework: t.uiFramework ?? null,
        priority: t.priority ?? 0,
      },
    });
  }
  await log("info", "system", `Platform profile created for workspace ${input.workspaceId}`);
  return profile;
}

export async function getPlatformProfile(workspaceId: string) {
  const profile = await db.platformProfile.findUnique({
    where: { workspaceId },
    include: { targets: true },
  });
  return profile;
}

export async function listPlatformProfiles() {
  return db.platformProfile.findMany({
    include: { targets: true },
    orderBy: { createdAt: "desc" },
  });
}
