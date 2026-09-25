"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Package,
  ShieldCheck,
  GitBranch,
  Boxes,
  Sparkles,
  Network,
  Layers,
} from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { PipelineSteps, type PipelineStepDef } from "@/components/pipeline-steps";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stat {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PRINCIPLES = [
  { title: "استقلال از LLM", desc: "لایه Application فقط با AI Gateway صحبت می‌کند." },
  { title: "تعقیب‌پذیری کامل", desc: "هر خروجی به ورودی و وظیفه‌اش لینک می‌شود." },
  { title: "دروازه‌های کیفیت", desc: "هر مرحله باید قبل از ادامه، تأیید شود." },
  { title: "حاکمیت انسانی", desc: "تصمیمات بحرانی به تأیید انسان می‌رسد." },
];

export function ControlView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setView = useAppStore((s) => s.setView);
  const [stats, setStats] = React.useState<Stat[]>([]);
  const [recentTasks, setRecentTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [tasks, artifacts, verifications, releases, incidents, workspaces] = await Promise.all([
          api<{ tasks: any[] }>("/api/tasks").catch(() => ({ tasks: [] })),
          api<{ artifacts: any[] }>("/api/artifacts").catch(() => ({ artifacts: [] })),
          api<{ verifications: any[] }>("/api/verification").catch(() => ({ verifications: [] })),
          api<{ releases: any[] }>("/api/releases").catch(() => ({ releases: [] })),
          api<{ incidents: any[] }>("/api/incidents").catch(() => ({ incidents: [] })),
          api<{ workspaces: any[] }>("/api/workspaces").catch(() => ({ workspaces: [] })),
        ]);
        const active = (workspaces.workspaces ?? []).length;
        const openTasks = (tasks.tasks ?? []).filter((t) => t.status !== "completed" && t.status !== "failed").length;
        const completed = (tasks.tasks ?? []).filter((t) => t.status === "completed").length;
        const openInc = (incidents.incidents ?? []).filter((i) => i.status === "open").length;
        setStats([
          { label: "فضاهای کار", value: active, icon: Boxes, color: "text-primary" },
          { label: "وظایف باز", value: openTasks, icon: ListTodo, color: "text-amber-500" },
          { label: "وظایف تکمیل", value: completed, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "خروجی‌ها", value: artifacts.artifacts?.length ?? 0, icon: Package, color: "text-blue-500" },
          { label: "تأییدها", value: verifications.verifications?.length ?? 0, icon: ShieldCheck, color: "text-purple-500" },
          { label: "انتشارها", value: releases.releases?.length ?? 0, icon: GitBranch, color: "text-teal-500" },
          { label: "حوادث باز", value: openInc, icon: AlertCircle, color: "text-rose-500" },
          { label: "کل وظایف", value: tasks.tasks?.length ?? 0, icon: Activity, color: "text-muted-foreground" },
        ]);
        setRecentTasks((tasks.tasks ?? []).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pipelineSteps: PipelineStepDef[] = [
    { key: "req", label: "نیازمندی", status: "done" },
    { key: "arch", label: "معماری", status: "done" },
    { key: "impl", label: "پیاده‌سازی", status: "running" },
    { key: "verify", label: "تأیید", status: "pending" },
    { key: "gate", label: "دروازه", status: "pending" },
    { key: "release", label: "انتشار", status: "pending" },
  ];

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">داشبورد کنترل</h1>
          <p className="text-sm text-muted-foreground">نمای کلی از وضعیت کارخانه نرم‌افزار YFG</p>
        </div>

        {!activeWorkspaceId && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">فضای کاری فعلی انتخاب نشده</p>
                <p className="text-xs text-muted-foreground">برای ادامه، یک فضای کار فعال انتخاب کنید.</p>
              </div>
              <Button size="sm" onClick={() => setView("workspaces")}>انتخاب</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-primary" />
              خط لوله تولید نرم‌افزار
            </CardTitle>
            <CardDescription className="text-xs">از تحلیل نیازمندی تا انتشار</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineSteps steps={pipelineSteps} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(loading ? Array(8).fill(null) : stats).map((s, i) => {
            if (!s) return <Card key={i} className="h-24 animate-pulse bg-muted/50" />;
            const Icon = s.icon;
            return (
              <Card key={i}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{s.value}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4" />
                وظایف اخیر
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">وظیفه‌ای ثبت نشده است.</p>
              ) : (
                <div className="space-y-2">
                  {recentTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{t.title}</span>
                      <span className="shrink-0 text-muted-foreground">{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                اصول معماری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {PRINCIPLES.map((p) => (
                  <div key={p.title} className="rounded-md border border-border bg-muted/30 p-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Layers className="h-3 w-3 text-primary" />
                      {p.title}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
