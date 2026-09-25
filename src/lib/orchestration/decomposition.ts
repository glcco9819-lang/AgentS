import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { chat } from "@/lib/ai/gateway";
import { audit } from "@/lib/governance/audit";

/**
 * Decomposition — break down a high-level task into sub-tasks via AI.
 */

export async function decomposeTask(input: {
  workspaceId: string;
  taskId?: string;
  title: string;
  description: string;
}): Promise<{ subtasks: Array<{ title: string; instruction: string; agentType?: string }> }> {
  const messages = [
    {
      role: "system" as const,
      content:
        "You are a task decomposer. Output STRICT JSON: " +
        '{"subtasks":[{"title":"...","instruction":"...","agentType":"backend-engineer"}]}. ' +
        "Agent types must be one of: product-manager, architect, ux-designer, frontend-engineer, " +
        "backend-engineer, database-engineer, devops-engineer, qa-engineer, security-engineer, " +
        "code-reviewer, doc-writer, release-engineer. Be terse.",
    },
    {
      role: "user" as const,
      content: `Task title: ${input.title}\nDescription: ${input.description}`,
    },
  ];
  let subtasks: Array<{ title: string; instruction: string; agentType?: string }> = [];
  try {
    const { content } = await chat(messages, { temperature: 0.3 });
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      subtasks = Array.isArray(parsed.subtasks) ? parsed.subtasks : [];
    }
  } catch (e) {
    await log("error", "system", `Decomposition failed: ${(e as Error).message}`);
  }

  await audit({
    workspaceId: input.workspaceId,
    actor: "decomposer",
    action: "task.decomposed",
    targetType: "task",
    targetId: input.taskId ?? "new",
    meta: { subtaskCount: subtasks.length },
  });

  return { subtasks };
}
