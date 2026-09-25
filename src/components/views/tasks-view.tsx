"use client";

import * as React from "react";
import { ListTodo, Plus, Bot, Clock } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/core/types";
import { PipelineSteps, type PipelineStepDef } from "@/components/pipeline-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  type: string;
  status: string;
  input?: string | null;
  output?: string | null;
  agent?: { name: string; type: string } | null;
  createdAt: string;
  finishedAt?: string | null;
  artifacts?: Array<{ id: string; name: string; type: string }>;
  verifications?: Array<{ id: string; type: string; result: string; report?: string | null }>;
}

export function TasksView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setView = useAppStore((s) => s.setView);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selected, setSelected] = React.useState<Task | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", type: "implementation", agentType: "backend-engineer", input: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeWorkspaceId ? `?workspaceId=${encodeURIComponent(activeWorkspaceId)}` : "";
      const data = await api<{ tasks: Task[] }>(`/api/tasks${qs}`);
      setTasks(data.tasks ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const loadTask = async (id: string) => {
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${id}`);
      setSelected(data.task);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const create = async () => {
    if (!activeWorkspaceId) {
      toast.error("ابتدا یک فضای کار انتخاب کنید");
      setView("workspaces");
      return;
    }
    if (!form.title || !form.input) {
      toast.error("عنوان و ورودی الزامی است");
      return;
    }
    setRunning(true);
    try {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ ...form, workspaceId: activeWorkspaceId }),
      });
      toast.success("وظیفه ایجاد و اجرا شد");
      setOpen(false);
      setForm({ title: "", type: "implementation", agentType: "backend-engineer", input: "" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h1 className="text-xl font-bold">وظایف</h1>
            <p className="text-xs text-muted-foreground">pipeline: Task → Agent → Verification → Gate → Approval</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                وظیفه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>ایجاد و اجرای وظیفه</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1.5">
                  <Label>عنوان</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>نوع وظیفه</Label>
                    <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نوع عامل</Label>
                    <Input value={form.agentType} onChange={(e) => setForm({ ...form, agentType: e.target.value })} dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ورودی (دستور)</Label>
                  <Textarea
                    rows={5}
                    value={form.input}
                    onChange={(e) => setForm({ ...form, input: e.target.value })}
                    placeholder="توضیح وظیفه برای عامل…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>لغو</Button>
                <Button onClick={create} disabled={running}>
                  {running ? "در حال اجرا…" : "ایجاد و اجرا"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-16 animate-pulse bg-muted/50" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <ListTodo className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">وظیفه‌ای ثبت نشده است.</p>
                  <p className="text-xs text-muted-foreground">یک وظیفه جدید ایجاد کنید یا از قالب‌ها استفاده کنید.</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((t) => (
                <Card
                  key={t.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-sm",
                    selected?.id === t.id && "ring-2 ring-primary"
                  )}
                  onClick={() => loadTask(t.id)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono" dir="ltr">{t.type}</span>
                        {t.agent && (
                          <span className="inline-flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {t.agent.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={cn("text-[10px]", STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] ?? "")}>
                      {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] ?? t.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {selected && (
        <aside className="hidden w-96 shrink-0 border-s border-border lg:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-base font-semibold">{selected.title}</h2>
                <p className="text-xs text-muted-foreground">
                  <Clock className="ms-1 inline h-3 w-3" />
                  {new Date(selected.createdAt).toLocaleString("fa-IR")}
                </p>
              </div>
              <div>
                <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">خط لوله</h3>
                <PipelineSteps steps={pipelineFor(selected.status)} />
              </div>
              {selected.input && (
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">ورودی</h3>
                  <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-[11px]" dir="ltr">{selected.input}</pre>
                </div>
              )}
              {selected.output && (
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">خروجی</h3>
                  <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-[11px]" dir="ltr">{selected.output?.slice(0, 2000)}</pre>
                </div>
              )}
              {selected.artifacts && selected.artifacts.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">خروجی‌ها</h3>
                  <div className="space-y-1">
                    {selected.artifacts.map((a) => (
                      <div key={a.id} className="rounded border border-border p-2 text-xs">
                        <span className="font-medium">{a.name}</span>
                        <span className="ms-2 text-muted-foreground font-mono">{a.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.verifications && selected.verifications.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">تأییدها</h3>
                  <div className="space-y-1">
                    {selected.verifications.map((v) => (
                      <div key={v.id} className="rounded border border-border p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono">{v.type}</span>
                          <Badge variant="outline" className="text-[10px]">{v.result}</Badge>
                        </div>
                        {v.report && <pre className="mt-1 max-h-32 overflow-auto text-[10px]" dir="ltr">{v.report.slice(0, 500)}</pre>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}

function pipelineFor(status: string): PipelineStepDef[] {
  return [
    { key: "create", label: "ایجاد", status: "done" },
    { key: "agent", label: "عامل", status: ["running", "verifying", "awaiting-approval", "completed"].includes(status) ? "done" : "running" },
    { key: "verify", label: "تأیید", status: ["verifying", "awaiting-approval", "completed"].includes(status) ? "done" : (status === "running" ? "running" : "pending") },
    { key: "gate", label: "دروازه", status: ["awaiting-approval", "completed"].includes(status) ? "done" : "pending" },
    { key: "approval", label: "تأیید نهایی", status: status === "completed" ? "done" : (status === "awaiting-approval" ? "running" : "pending") },
  ];
}
