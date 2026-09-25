import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { createHash } from "crypto";

/**
 * Knowledge Base — lightweight TF-based local embedding (256-dim hashed).
 * No external embedding API needed; sufficient for small-scale semantic search.
 */

const EMBED_DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function localEmbed(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array(EMBED_DIM).fill(0);
  for (const t of tokens) {
    const h = createHash("sha256").update(t).digest();
    for (let i = 0; i < 8; i++) {
      const idx = h.readUInt32BE(i * 4) % EMBED_DIM;
      vec[idx] += 1;
    }
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export async function createKnowledge(input: {
  workspaceId?: string;
  title: string;
  content: string;
  kind: string;
  tags?: string[];
}) {
  const embedding = localEmbed(input.content);
  const entry = await db.knowledgeEntry.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      title: input.title,
      content: input.content,
      kind: input.kind,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      embedding: JSON.stringify(embedding),
    },
  });
  await log("info", "system", `Knowledge entry created: ${input.title}`);
  return entry;
}

export async function searchKnowledge(query: string, opts?: { workspaceId?: string; limit?: number }) {
  const queryVec = localEmbed(query);
  const entries = await db.knowledgeEntry.findMany({
    where: opts?.workspaceId ? { workspaceId: opts.workspaceId } : undefined,
    take: 500,
  });
  const scored = entries
    .map((e) => {
      let vec: number[] = [];
      try {
        vec = JSON.parse(e.embedding ?? "[]");
      } catch {
        // ignore
      }
      return {
        ...e,
        score: cosine(queryVec, vec),
      };
    })
    .filter((e) => e.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts?.limit ?? 10);
  return scored;
}

export async function listKnowledge(workspaceId?: string) {
  return db.knowledgeEntry.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
