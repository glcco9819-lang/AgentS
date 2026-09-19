"use client";

import * as React from "react";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  streaming?: boolean;
}

interface StreamHandlers {
  onSession?: (sessionId: string) => void;
  onDone?: (assistantMessageId: string) => void;
  onError?: (message: string) => void;
}

/**
 * Streams a chat reply from /api/chat (SSE) and yields deltas.
 * Protocol: data: {"type":"session|delta|done|error", ...}
 */
export async function streamChat(
  body: { sessionId?: string; message: string; promptKey?: string; language?: "fa" | "en" },
  onDelta: (text: string) => void,
  handlers: StreamHandlers = {},
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`درخواست ناموفق (${res.status}): ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!chunk.startsWith("data:")) continue;
      const jsonStr = chunk.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const evt = JSON.parse(jsonStr);
        if (evt.type === "session" && evt.sessionId) handlers.onSession?.(evt.sessionId);
        else if (evt.type === "delta" && typeof evt.content === "string") onDelta(evt.content);
        else if (evt.type === "done" && evt.messageId) handlers.onDone?.(evt.messageId);
        else if (evt.type === "error" && evt.message) handlers.onError?.(evt.message);
      } catch {
        /* partial json across chunks — ignore */
      }
    }
  }
}
