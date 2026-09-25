import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { chat } from "@/lib/ai/gateway";
import { getIntelligenceStats } from "@/lib/intelligence/scanner";

/**
 * Architecture Review — analyze layers, dependencies, identify hotspots,
 * then run AI review.
 */

export async function reviewArchitecture(input: {
  environmentId?: string;
  workspaceId?: string;
  focus?: string;
}) {
  let layers: Array<{ name: string; files: number; languages: string[] }> = [];
  let hotspots: Array<{ path: string; size: number; inDegree: number }> = [];

  if (input.environmentId) {
    const files = await db.fileIndex.findMany({ where: { environmentId: input.environmentId } });
    // Detect layers by path prefixes
    const layerMap: Record<string, { files: number; languages: Set<string> }> = {};
    for (const f of files) {
      const seg = f.path.split("/")[0] || "root";
      if (!layerMap[seg]) layerMap[seg] = { files: 0, languages: new Set() };
      layerMap[seg].files++;
      if (f.language) layerMap[seg].languages.add(f.language);
    }
    layers = Object.entries(layerMap).map(([name, v]) => ({
      name,
      files: v.files,
      languages: Array.from(v.languages),
    }));

    // Hotspots: largest files & files with most incoming edges
    const bySize = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
    for (const f of bySize) {
      const inDegree = await db.dependencyEdge.count({
        where: { targetPath: f.path },
      });
      hotspots.push({ path: f.path, size: f.size, inDegree });
    }
  }

  // Run AI review
  let aiReview = "";
  try {
    const context =
      `Layers:\n${layers.map((l) => `- ${l.name}: ${l.files} files (${l.languages.join(", ")})`).join("\n")}\n\n` +
      `Hotspots:\n${hotspots.map((h) => `- ${h.path} (${h.size}b, in-deg ${h.inDegree})`).join("\n")}`;
    const { content } = await chat([
      {
        role: "system",
        content:
          "You are a software architect. Output a Persian Markdown report: " +
          "## لایه‌ها\n## نقاط داغ\n## نقاط قوت\n## نقاط ضعف\n## توصیه‌ها.",
      },
      {
        role: "user",
        content:
          `Project architecture:\n${context}\n\n` +
          (input.focus ? `Focus: ${input.focus}` : ""),
      },
    ], { temperature: 0.4 });
    aiReview = content;
  } catch (e) {
    aiReview = `خطا در تولید گزارش هوش مصنوعی: ${(e as Error).message}`;
  }

  await log("info", "system", `Architecture review completed`, {
    layers: layers.length,
    hotspots: hotspots.length,
  });

  return { layers, hotspots, aiReview, stats: await getIntelligenceStats(input.environmentId).catch(() => null) };
}
