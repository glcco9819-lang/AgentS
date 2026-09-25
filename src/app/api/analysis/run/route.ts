import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { analyzeStream, ANALYSIS_LABELS, type AnalysisKind } from "@/lib/analysis/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const kind = (body.kind ?? "code-quality") as AnalysisKind;
  if (!ANALYSIS_LABELS[kind]) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of analyzeStream({
          environmentId: body.environmentId,
          workspaceId: body.workspaceId,
          kind,
          prompt: body.prompt,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
