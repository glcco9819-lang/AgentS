import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { createEnvironment } from "@/lib/engineering/sandbox";
import { createAndRunTask } from "@/lib/core/orchestrator";
import { commit } from "@/lib/engineering/git";
import { getRepoPath } from "@/lib/engineering/sandbox";
import { writeFile } from "@/lib/engineering/git";
import { scanEnvironment } from "@/lib/intelligence/scanner";
import { runVerification } from "@/lib/verification/engine";
import { createRelease, publishRelease } from "@/lib/release/engine";
import { createKnowledge } from "@/lib/knowledge/engine";
import { notify } from "@/lib/notifications/engine";

/**
 * YFG Factory — end-to-end factory run:
 * create env → PM task → Architect task → Backend task (write file) → git commit
 * → scan → code review → release → knowledge → notify
 */

export interface FactoryRunResult {
  workspaceId: string;
  environmentId: string;
  taskId: string;
  releaseId: string;
  steps: Array<{ name: string; ok: boolean; details?: string }>;
}

export async function runFactory(input: {
  workspaceId: string;
  title: string;
  requirement: string;
}): Promise<FactoryRunResult> {
  const steps: FactoryRunResult["steps"] = [];
  const t0 = Date.now();

  // 1. Create environment
  let env;
  try {
    env = await createEnvironment({
      workspaceId: input.workspaceId,
      name: `factory-${Date.now()}`,
    });
    steps.push({ name: "createEnvironment", ok: true, details: env.id });
  } catch (e) {
    steps.push({ name: "createEnvironment", ok: false, details: (e as Error).message });
    return { workspaceId: input.workspaceId, environmentId: "", taskId: "", releaseId: "", steps };
  }

  // 2. PM task
  let pmTaskId = "";
  try {
    const r = await createAndRunTask({
      workspaceId: input.workspaceId,
      agentType: "product-manager",
      type: "requirement-analysis",
      title: `PM: ${input.title}`,
      input: input.requirement,
    });
    pmTaskId = r.taskId;
    steps.push({ name: "pm", ok: r.status !== "failed", details: r.status });
  } catch (e) {
    steps.push({ name: "pm", ok: false, details: (e as Error).message });
  }

  // 3. Architect task
  let archOutput = "";
  try {
    const r = await createAndRunTask({
      workspaceId: input.workspaceId,
      agentType: "architect",
      type: "architecture-design",
      title: `Architect: ${input.title}`,
      input: input.requirement,
      context: `PM analysis (task ${pmTaskId})`,
    });
    archOutput = r.output ?? "";
    steps.push({ name: "architect", ok: r.status !== "failed", details: r.status });
  } catch (e) {
    steps.push({ name: "architect", ok: false, details: (e as Error).message });
  }

  // 4. Backend task — write a file to the env's git repo
  let beTaskId = "";
  let fileContent = "";
  try {
    const r = await createAndRunTask({
      workspaceId: input.workspaceId,
      agentType: "backend-engineer",
      type: "implementation",
      title: `Backend: ${input.title}`,
      input: `Implement based on this architecture:\n\n${archOutput}\n\nRequirement: ${input.requirement}`,
    });
    beTaskId = r.taskId;
    fileContent = r.output ?? "// no output";
    // Write file to repo
    const repoPath = env.repoPath || getRepoPath(env.id);
    const fileName = "src/index.ts";
    writeFile(repoPath, fileName, fileContent);
    steps.push({ name: "backend", ok: true, details: r.status });
  } catch (e) {
    steps.push({ name: "backend", ok: false, details: (e as Error).message });
  }

  // 5. Git commit
  try {
    const repoPath = env.repoPath || getRepoPath(env.id);
    const r = commit(repoPath, `feat: ${input.title}`);
    steps.push({ name: "git-commit", ok: r.success, details: r.sha?.slice(0, 7) });
    if (r.sha) {
      await db.environment.update({
        where: { id: env.id },
        data: { commits: { create: { sha: r.sha, message: `feat: ${input.title}`, author: "yfg-bot", filesChanged: 1 } } },
      });
    }
  } catch (e) {
    steps.push({ name: "git-commit", ok: false, details: (e as Error).message });
  }

  // 6. Scan
  try {
    const result = await scanEnvironment(env.id);
    steps.push({ name: "scan", ok: true, details: `${result.total} files` });
  } catch (e) {
    steps.push({ name: "scan", ok: false, details: (e as Error).message });
  }

  // 7. Code review verification
  let beArtifactId = "";
  try {
    const arts = await db.artifact.findFirst({ where: { taskId: beTaskId } });
    if (arts) {
      beArtifactId = arts.id;
      await runVerification({
        taskId: beTaskId,
        artifactId: beArtifactId,
        type: "code-review",
        content: fileContent,
      });
    }
    steps.push({ name: "codeReview", ok: true, details: "scheduled" });
  } catch (e) {
    steps.push({ name: "codeReview", ok: false, details: (e as Error).message });
  }

  // 8. Release
  let releaseId = "";
  try {
    const rel = await createRelease({
      workspaceId: input.workspaceId,
      environmentId: env.id,
      version: `0.1.${Date.now() % 1000}`,
      name: input.title,
      notes: `Factory-generated release for: ${input.title}`,
    });
    releaseId = rel.id;
    await publishRelease(rel.id, "factory");
    steps.push({ name: "release", ok: true, details: rel.id });
  } catch (e) {
    steps.push({ name: "release", ok: false, details: (e as Error).message });
  }

  // 9. Knowledge entry
  try {
    await createKnowledge({
      workspaceId: input.workspaceId,
      title: input.title,
      content: `Requirement: ${input.requirement}\n\nArchitecture:\n${archOutput}`,
      kind: "factory-run",
      tags: ["factory", input.workspaceId],
    });
    steps.push({ name: "knowledge", ok: true });
  } catch (e) {
    steps.push({ name: "knowledge", ok: false, details: (e as Error).message });
  }

  // 10. Notify
  try {
    await notify({
      recipient: "admin",
      type: "factory",
      title: `Factory run completed: ${input.title}`,
      message: `Steps: ${steps.length}, OK: ${steps.filter((s) => s.ok).length}`,
      link: `/api/workspaces/${input.workspaceId}`,
    });
    steps.push({ name: "notify", ok: true });
  } catch (e) {
    steps.push({ name: "notify", ok: false, details: (e as Error).message });
  }

  await audit({
    workspaceId: input.workspaceId,
    actor: "factory",
    action: "factory.run",
    targetType: "workspace",
    targetId: input.workspaceId,
    meta: { steps: steps.length, ok: steps.filter((s) => s.ok).length, durationMs: Date.now() - t0 },
  });
  await log("info", "system", `Factory run completed for ${input.title}`, {
    workspaceId: input.workspaceId,
    durationMs: Date.now() - t0,
  });

  return {
    workspaceId: input.workspaceId,
    environmentId: env.id,
    taskId: beTaskId,
    releaseId,
    steps,
  };
}
