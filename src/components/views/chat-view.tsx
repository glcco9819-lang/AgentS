"use client";

import * as React from "react";
import {
  Plus,
  Send,
  Trash2,
  MessagesSquare,
  Loader2,
  Square,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { streamChat, type ChatMessage } from "@/hooks/use-chat-stream";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

export function ChatView() {
  const { activeSessionId, setActiveSessionId } = useAppStore();
  const { toast } = useToast();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  // When a brand-new session is created mid-stream, we set this to true so the
  // messages-loading effect does NOT clobber the optimistic in-flight messages.
  const skipLoadRef = React.useRef(false);

  // Load sessions
  const loadSessions = React.useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when active session changes
  React.useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    // Skip loading when this session id was just produced by an in-flight stream
    // (the optimistic messages are already in state).
    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${activeSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.session) {
          setMessages(
            (data.session.messages ?? []).filter((m: ChatMessage) => m.role !== "system")
          );
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  // Auto-scroll on new content
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    taRef.current?.focus();
  };

  const selectSession = (id: string) => setActiveSessionId(id);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (activeSessionId === id) setActiveSessionId(null);
    loadSessions();
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    // Resize textarea back
    if (taRef.current) taRef.current.style.height = "auto";

    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { sessionId: activeSessionId ?? undefined, message: text },
        (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, content: last.content + delta };
            }
            return next;
          });
        },
        {
          onSession: (sid) => {
            if (!activeSessionId) {
              skipLoadRef.current = true;
              setActiveSessionId(sid);
            }
          },
          onDone: () => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = { ...last, streaming: false };
              }
              return next;
            });
          },
          onError: (msg) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  streaming: false,
                  content: last.content || `⚠️ خطا: ${msg}`,
                };
              }
              return next;
            });
            toast({ title: "خطای Gateway", description: msg, variant: "destructive" });
          },
        },
        controller.signal
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && last.streaming) {
            next[next.length - 1] = { ...last, streaming: false };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      loadSessions();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="flex min-h-0 flex-1">
      {/* Chat window */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="تoggle sessions panel"
          >
            {panelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {activeSessionId
                ? sessions.find((s) => s.id === activeSessionId)?.title ?? "گفت‌وگو"
                : "گفت‌وگوی جدید"}
            </div>
          </div>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Sparkles className="h-3 w-3 text-primary" />
            GLM-4.7-Flash
          </Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin">
          {messages.length === 0 && !loadingMessages ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background/80 p-3 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative rounded-xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <Textarea
                ref={taRef}
                value={input}
                onChange={onInput}
                onKeyDown={onKeyDown}
                placeholder="پیام خود را بنویسید… (Enter برای ارسال، Shift+Enter برای خط جدید)"
                rows={1}
                className="min-h-[52px] resize-none border-0 bg-transparent px-4 py-3.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={streaming}
              />
              <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
                <span className="text-[10px] text-muted-foreground">
                  پرامپت پایه از Prompt Manager خوانده می‌شود
                </span>
                {streaming ? (
                  <Button size="sm" variant="destructive" className="gap-1.5" onClick={stop}>
                    <Square className="h-3.5 w-3.5" />
                    توقف
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={send}
                    disabled={!input.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                    ارسال
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sessions panel */}
      {panelOpen && (
        <aside className="hidden w-72 shrink-0 flex-col border-s border-border bg-sidebar/40 lg:flex">
          <div className="flex h-12 items-center justify-between border-b border-border px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              گفت‌وگوها
            </span>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={newChat}>
              <Plus className="h-3.5 w-3.5" />
              جدید
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  هنوز گفت‌وگویی وجود ندارد. اولین پیام را ارسال کنید.
                </div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right transition-colors",
                      activeSessionId === s.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/60"
                    )}
                  >
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true, locale: faIR })}
                        {s._count ? ` · ${s._count.messages} پیام` : ""}
                      </div>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("mb-6 flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? "ش" : "AI"}
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "rounded-tr-sm bg-secondary text-secondary-foreground"
            : "rounded-tl-sm bg-card border border-border"
        )}
      >
        {message.content ? (
          isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )
        ) : message.streaming ? (
          <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </span>
            <span className="text-xs">در حال تفکر…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  const suggestions = [
    "ساختار یک پروژه‌ی ERP چندلایه را توضیح بده",
    "بهترین روش برای پیاده‌سازی Authentication در دات‌نت چیست؟",
    "این تابع را بازبینی کن: public int Add(int a, int b) => a - b;",
    "تفاوت Repository Pattern با CQRS را بیان کن",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">دستیار پروژه‌ی هوش مصنوعی محلی</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        با مدل GLM-4.7-Flash از طریق AI Gateway مستقل صحبت کنید. معماری طوری طراحی شده که
        در فازهای بعدی Scanner، Context Engine و RAG بدون بازنویسی اضافه شوند.
      </p>
      <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border border-border bg-card p-3 text-right text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/50 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// tiny helper removed
