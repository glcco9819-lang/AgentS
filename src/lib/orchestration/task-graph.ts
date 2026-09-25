import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Task Graph — DAG of tasks with dependencies (topological order).
 */

export interface GraphNode {
  id: string;
  label: string;
  agentType?: string;
  dependsOn?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export async function createTaskGraph(input: {
  workspaceId: string;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const graph = await db.taskGraph.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      nodes: JSON.stringify(input.nodes),
      edges: JSON.stringify(input.edges),
    },
  });
  await log("info", "system", `Task graph ${graph.id} created`, {
    nodes: input.nodes.length,
    edges: input.edges.length,
  });
  return graph;
}

export async function getTaskGraph(id: string) {
  const g = await db.taskGraph.findUnique({ where: { id } });
  if (!g) return null;
  let nodes: GraphNode[] = [];
  let edges: GraphEdge[] = [];
  try {
    nodes = JSON.parse(g.nodes);
    edges = JSON.parse(g.edges);
  } catch {
    // ignore
  }
  return { ...g, nodes, edges };
}

export async function getReadyTasks(graph: { nodes: GraphNode[]; edges: GraphEdge[]; completedIds?: string[] }) {
  const completed = new Set(graph.completedIds ?? []);
  const incoming = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e.source);
  }
  return graph.nodes.filter((n) => {
    const deps = incoming.get(n.id) ?? [];
    return deps.every((d) => completed.has(d));
  });
}

export async function getTopologicalOrder(graph: { nodes: GraphNode[]; edges: GraphEdge[] }): Promise<GraphNode[]> {
  const incoming = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e.source);
  }
  const sorted: GraphNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) return; // cycle — bail
    visiting.add(id);
    for (const dep of incoming.get(id) ?? []) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) sorted.push(node);
  };
  for (const n of graph.nodes) visit(n.id);
  return sorted;
}

export async function listTaskGraphs(workspaceId?: string) {
  return db.taskGraph.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
