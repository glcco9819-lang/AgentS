import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { chatStream, resolveConfig, type ChatMessage } from "@/lib/ai/gateway";
import { getPrompt } from "@/lib/ai/prompts";
import { log } from "@/lib/logger";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat
 * Body: { sessionId?: string, message: string, promptKey?: string, language?: "fa"|"en" }
 *
 * Streams the assistant reply as Server-Sent-Events:
 *   data: {"type":"session","sessionId":"..."}\n\n
 *   data: {"type":"delta","content":"..."}\n\n   (many)
 *   data: {"type":"done","messageId":"..."}\n\n
 *   data: {"type":"error","message":"..."}\n\n
 */
export async function POST(req: NextRequest) {
  await ensureSeed();

  let body: { sessionId?: string; message?: string; promptKey?: string; language?: "fa" | "en" };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userMessage = (body.message ?? "").trim();
  if (!userMessage) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const promptKey = (body.promptKey ?? "system") as Parameters<typeof getPrompt>[0];
  const language = body.language ?? "fa";

  // Resolve or create session
  let session = body.sessionId
    ? await db.session.findUnique({ where: { id: body.sessionId } })
    : null;
  if (!session) {
    const title =
      userMessage.length > 48 ? userMessage.slice(0, 48) + "…" : userMessage;
    session = await db.session.create({ data: { title } });
  }

  // Persist the user message
  await db.message.create({
    data: { sessionId: session.id, role: "user", content: userMessage },
  });

  // Load recent history (trimmed to maxContextMessages)
  const config = await resolveConfig();
  const recent = await db.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: config.maxContextMessages,
  });

  const systemPrompt = await getPrompt(promptKey, language);
  const messages: ChatMessage[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  for (const m of recent) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role as ChatMessage["role"], content: m.content });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (obj: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      send({ type: "session", sessionId: session!.id });

      let full = "";
      try {
        for await (const delta of chatStream(messages)) {
          if (closed || req.signal?.aborted) break; // client disconnected
          full += delta;
          send({ type: "delta", content: delta });
        }
        if (closed || req.signal?.aborted) {
          // Client gone — still persist whatever was produced so context isn't lost
          if (full.trim()) {
            await db.message.create({
              data: { sessionId: session!.id, role: "assistant", content: full },
            });
          }
          return;
        }
        const assistant = await db.message.create({
          data: {
            sessionId: session!.id,
            role: "assistant",
            content: full || "(پاسخی دریافت نشد)",
          },
        });
        send({ type: "done", messageId: assistant.id });
      } catch (e) {
        const msg = (e as Error).message || "Unknown gateway error";
        await log("error", "chat", "Chat stream failed", { sessionId: session!.id, message: msg });
        // Persist whatever was produced so context isn't lost
        if (full.trim()) {
          await db.message.create({
            data: { sessionId: session!.id, role: "assistant", content: full },
          });
        }
        send({ type: "error", message: msg });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
