import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { createAndRunTask } from "@/lib/core/orchestrator";
import type { AgentType } from "@/lib/core/types";
import { audit } from "@/lib/governance/audit";

/**
 * Workflow engine — multi-step task sequences with handoff.
 */

export interface WorkflowStep {
  id: string;
  agentType: AgentType;
  taskType: string;
  title: string;
  instruction: string;
  dependsOn?: string[];
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export async function runWorkflow(
  workspaceId: string,
  def: WorkflowDefinition
): Promise<{ results: Array<{ stepId: string; taskId: string; status: string }> }> {
  const results: Array<{ stepId: string; taskId: string; status: string }> = [];
  const stepOutputs = new Map<string, string>();

  // Naive topological order: keep iterating until all resolved
  const pending = [...def.steps];
  let iter = 0;
  while (pending.length > 0 && iter < 50) {
    iter++;
    const ready = pending.filter(
      (s) => !s.dependsOn || s.dependsOn.every((d) => stepOutputs.has(d))
    );
    if (ready.length === 0) {
      await log("warn", "system", "Workflow stalled — unresolvable deps", {
        steps: pending.map((s) => s.id),
      });
      break;
    }
    for (const step of ready) {
      const ctx = step.dependsOn
        ?.map((d) => stepOutputs.get(d) ?? "")
        .join("\n\n---\n\n");
      const r = await createAndRunTask({
        workspaceId,
        agentType: step.agentType,
        type: step.taskType,
        title: step.title,
        input: step.instruction,
        context: ctx,
        parentTaskId: undefined,
      });
      results.push({ stepId: step.id, taskId: r.taskId, status: r.status });
      stepOutputs.set(step.id, r.output ?? "");
      // remove from pending
      const idx = pending.findIndex((p) => p.id === step.id);
      if (idx >= 0) pending.splice(idx, 1);
    }
  }

  await audit({
    workspaceId,
    actor: "workflow",
    action: "workflow.completed",
    targetType: "workspace",
    targetId: workspaceId,
    meta: { name: def.name, steps: def.steps.length },
  });

  await log("info", "system", `Workflow "${def.name}" completed`, {
    steps: results.length,
  });

  return { results };
}

export async function generateWorkspaceReport(workspaceId: string) {
  const tasks = await db.task.findMany({ where: { workspaceId } });
  const artifacts = await db.artifact.findMany({ where: { workspaceId } });
  const verifications = await db.verification.findMany({
    where: { task: { workspaceId } },
  });
  const gates = await db.qualityGate.findMany({
    where: { task: { workspaceId } },
  });
  const releases = await db.release.findMany({ where: { workspaceId } });
  const incidents = await db.incident.findMany({ where: { workspaceId } });

  return {
    workspaceId,
    summary: {
      tasks: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      artifacts: artifacts.length,
      verifications: verifications.length,
      passes: verifications.filter((v) => v.result === "pass").length,
      gates: gates.length,
      approvals: gates.filter((g) => g.decision === "approved").length,
      releases: releases.length,
      incidents: incidents.length,
    },
    recent: tasks.slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}
