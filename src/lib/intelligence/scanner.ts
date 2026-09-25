import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { getRepoPath } from "@/lib/engineering/sandbox";
import { listFiles, readFile } from "@/lib/engineering/git";
import { existsSync, statSync } from "fs";
import { extname, basename, relative, join } from "path";

/**
 * Project Intelligence — scans an environment for files, symbols, dependencies.
 * Powers the "Intelligence" view and impact analysis.
 */

const LANG_BY_EXT: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".json": "json",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".md": "markdown",
  ".css": "css",
  ".html": "html",
};

export async function scanEnvironment(environmentId: string) {
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) throw new Error("Environment not found");
  const repoPath = env.repoPath || getRepoPath(env.id);
  if (!existsSync(repoPath)) {
    return { files: [], symbols: [], dependencies: [], total: 0 };
  }

  // Clear previous index for this env
  await db.fileIndex.deleteMany({ where: { environmentId } });
  await db.dependencyEdge.deleteMany({ where: { environmentId } });

  const files = listFiles(repoPath);
  const indexed: Array<{ path: string; extension: string; language: string; size: number; lineCount: number }> = [];
  for (const f of files) {
    const full = join(repoPath, f);
    if (!existsSync(full)) continue;
    const stat = statSync(full);
    const ext = extname(f);
    const lang = LANG_BY_EXT[ext] ?? "unknown";
    let lineCount = 0;
    try {
      const content = readFile(repoPath, f);
      if (content) lineCount = content.split("\n").length;
    } catch {
      // ignore
    }
    const row = await db.fileIndex.create({
      data: {
        environmentId,
        path: f,
        extension: ext,
        size: stat.size,
        language: lang,
        lineCount,
        symbolCount: 0,
      },
    });
    // Detect simple imports → dependency edges
    const content = readFile(repoPath, f);
    if (content) {
      const importRe = /(?:import|require|from)\s+['"]([.@/\w][^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = importRe.exec(content)) !== null) {
        const target = m[1];
        await db.dependencyEdge.create({
          data: {
            environmentId,
            sourcePath: f,
            targetPath: target,
            relation: "imports",
          },
        }).catch(() => {});
      }
      // Extract function-like symbols
      const symRe = /(?:function|def|class|const|let|var)\s+([A-Za-z_][\w]*)/g;
      let sm: RegExpExecArray | null;
      while ((sm = symRe.exec(content)) !== null) {
        const line = content.slice(0, sm.index).split("\n").length;
        await db.symbol.create({
          data: {
            fileId: row.id,
            name: sm[1],
            kind: "function",
            line,
            language: lang,
          },
        }).catch(() => {});
      }
    }
    indexed.push({ path: f, extension: ext, language: lang, size: stat.size, lineCount });
  }

  await log("info", "system", `Scan complete for env ${environmentId}`, {
    files: indexed.length,
  });

  return {
    files: indexed,
    symbols: [],
    dependencies: [],
    total: indexed.length,
  };
}

export async function getDependencyGraph(environmentId: string) {
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) throw new Error("Environment not found");
  const edges = await db.dependencyEdge.findMany({ where: { environmentId } });
  const nodes = new Set<string>();
  for (const e of edges) {
    nodes.add(e.sourcePath);
    nodes.add(e.targetPath);
  }
  return {
    nodes: Array.from(nodes).map((id) => ({ id })),
    edges: edges.map((e) => ({ source: e.sourcePath, target: e.targetPath, relation: e.relation })),
  };
}

export async function impactAnalysis(environmentId: string, changedPath: string) {
  const env = await db.environment.findUnique({ where: { id: environmentId } });
  if (!env) throw new Error("Environment not found");
  // BFS forward: who depends on changedPath (directly or transitively)?
  const impacted = new Set<string>();
  const frontier = [changedPath];
  let depth = 0;
  while (frontier.length > 0 && depth < 5) {
    const next: string[] = [];
    for (const path of frontier) {
      const incoming = await db.dependencyEdge.findMany({
        where: { targetPath: path },
      });
      for (const e of incoming) {
        if (!impacted.has(e.sourcePath)) {
          impacted.add(e.sourcePath);
          next.push(e.sourcePath);
        }
      }
    }
    frontier.length = 0;
    frontier.push(...next);
    depth++;
  }
  const report = await db.impactReport.create({
    data: {
      environmentId,
      changedPath,
      impactedPaths: JSON.stringify(Array.from(impacted)),
      depth,
    },
  });
  await log("info", "system", `Impact analysis for ${changedPath}`, {
    impacted: impacted.size,
    depth,
  });
  return { reportId: report.id, impacted: Array.from(impacted), depth };
}

export async function getIntelligenceStats(environmentId?: string) {
  const fileWhere = environmentId ? { environmentId } : {};
  const files = await db.fileIndex.findMany({ where: fileWhere });
  const langCounts: Record<string, number> = {};
  for (const f of files) {
    langCounts[f.language] = (langCounts[f.language] ?? 0) + 1;
  }
  const edgeCount = await db.dependencyEdge.count({ where: fileWhere });
  const symbolCount = await db.symbol.count();
  return {
    totalFiles: files.length,
    totalSymbols: symbolCount,
    totalEdges: edgeCount,
    byLanguage: langCounts,
  };
}

/** Walk the file tree (async generator) — used by the scanner for streaming. */
export async function* walkFiles(repoPath: string): AsyncGenerator<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  async function* walk(dir: string): AsyncGenerator<string> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".git" || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        yield* walk(full);
      } else {
        yield full;
      }
    }
  }
  yield* walk(repoPath);
}
