import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { createAndRunTask } from "@/lib/core/orchestrator";
import type { AgentType } from "@/lib/core/types";

/**
 * Workflow Engine — create/run multi-step workflows with pause/resume.
 */

export interface WorkflowStepDef {
  id: string;
  agentType: AgentType;
  taskType: string;
  title: string;
  instruction: string;
  dependsOn?: string[];
}

export async function createWorkflow(input: {
  workspaceId?: string;
  name: string;
  description?: string;
  steps: WorkflowStepDef[];
}) {
  const wf = await db.workflow.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      name: input.name,
      description: input.description ?? null,
      definition: JSON.stringify(input.steps),
      status: "draft",
    },
  });
  await log("info", "system", `Workflow ${wf.id} created`, { steps: input.steps.length });
  return wf;
}

export async function runWorkflow(input: {
  workflowId: string;
  workspaceId: string;
  resumeFromStep?: number;
}): Promise<{ runId: string; status: string; currentStep: number; results: Array<{ stepId: string; taskId: string; status: string }> }> {
  const wf = await db.workflow.findUnique({ where: { id: input.workflowId } });
  if (!wf) throw new Error("Workflow not found");
  let steps: WorkflowStepDef[] = [];
  try {
    steps = JSON.parse(wf.definition);
  } catch {
    throw new Error("Invalid workflow definition");
  }
  const run = await db.workflowRun.create({
    data: {
      workflowId: input.workflowId,
      workspaceId: input.workspaceId,
      status: "running",
      currentStep: input.resumeFromStep ?? 0,
      startedAt: new Date(),
    },
  });

  const results: Array<{ stepId: string; taskId: string; status: string }> = [];
  const stepOutputs = new Map<string, string>();
  const startIdx = input.resumeFromStep ?? 0;

  // Resolve dependencies iteratively (topological-ish)
  const pending = steps.slice(startIdx);
  let iter = 0;
  while (pending.length > 0 && iter < 50) {
    iter++;
    const ready = pending.filter(
      (s) => !s.dependsOn || s.dependsOn.every((d) => stepOutputs.has(d))
    );
    if (ready.length === 0) {
      await db.workflowRun.update({
        where: { id: run.id },
        data: { status: "failed", finishedAt: new Date() },
      });
      break;
    }
    for (const step of ready) {
      const ctx = step.dependsOn
        ?.map((d) => stepOutputs.get(d) ?? "")
        .join("\n\n---\n\n");
      const r = await createAndRunTask({
        workspaceId: input.workspaceId,
        agentType: step.agentType,
        type: step.taskType,
        title: step.title,
        input: step.instruction,
        context: ctx,
      });
      results.push({ stepId: step.id, taskId: r.taskId, status: r.status });
      stepOutputs.set(step.id, r.output ?? "");
      const idx = pending.findIndex((p) => p.id === step.id);
      if (idx >= 0) pending.splice(idx, 1);
      await db.workflowRun.update({
        where: { id: run.id },
        data: { currentStep: results.length },
      });
    }
  }

  const status = pending.length === 0 ? "completed" : "failed";
  await db.workflowRun.update({
    where: { id: run.id },
    data: { status, finishedAt: new Date() },
  });
  await audit({
    workspaceId: input.workspaceId,
    actor: "workflow-engine",
    action: "workflow.run",
    targetType: "workflow",
    targetId: input.workflowId,
    meta: { status, steps: results.length },
  });
  await log("info", "system", `Workflow ${input.workflowId} ${status}`, {
    runId: run.id,
    steps: results.length,
  });

  return { runId: run.id, status, currentStep: results.length, results };
}

export async function pauseWorkflow(runId: string) {
  return db.workflowRun.update({
    where: { id: runId },
    data: { status: "paused" },
  });
}

export async function resumeWorkflow(runId: string) {
  const run = await db.workflowRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error("Run not found");
  return db.workflowRun.update({
    where: { id: runId },
    data: { status: "running" },
  });
}

export async function listWorkflows(workspaceId?: string) {
  return db.workflow.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { runs: { take: 5, orderBy: { createdAt: "desc" } } },
  });
}

export async function getWorkflow(id: string) {
  return db.workflow.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: "desc" } } },
  });
}
