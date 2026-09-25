"use client";

import * as React from "react";
import { LayoutTemplate, Plus, Search } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/core/task-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  instruction: string;
  agentType: string;
  taskType: string;
  verificationType: string;
  icon?: string | null;
  isCustom: boolean;
}

export function TemplatesView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setView = useAppStore((s) => s.setView);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [filter, setFilter] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    category: "implement",
    description: "",
    instruction: "",
    agentType: "backend-engineer",
    taskType: "implementation",
    verificationType: "code-review",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ templates: Template[] }>("/api/templates");
      setTemplates(data.templates ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = templates.filter((t) => {
    if (filter && t.category !== filter) return false;
    if (search && !t.name.includes(search) && !t.description.includes(search)) return false;
    return true;
  });

  const create = async () => {
    if (!form.name || !form.instruction) {
      toast.error("نام و دستورالعمل الزامی است");
      return;
    }
    try {
      await api("/api/templates", { method: "POST", body: JSON.stringify(form) });
      toast.success("قالب ایجاد شد");
      setOpen(false);
      setForm({
        name: "",
        category: "implement",
        description: "",
        instruction: "",
        agentType: "backend-engineer",
        taskType: "implementation",
        verificationType: "code-review",
      });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">قالب‌های وظیفه</h1>
            <p className="text-sm text-muted-foreground">کتابخانه قالب‌های آماده برای شروع سریع</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                قالب سفارشی
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد قالب سفارشی</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1.5">
                  <Label>نام</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>دسته</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نوع عامل</Label>
                    <Input value={form.agentType} onChange={(e) => setForm({ ...form, agentType: e.target.value })} dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>توضیح</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>دستورالعمل</Label>
                  <Input value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>لغو</Button>
                <Button onClick={create}>ایجاد</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو…"
              className="pr-8 text-xs"
            />
          </div>
          <Button
            variant={filter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("")}
            className="text-xs"
          >
            همه
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>

        {!activeWorkspaceId && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="p-3 text-xs text-amber-700 dark:text-amber-300">
              برای اجرای قالب، یک فضای کار فعال انتخاب کنید.
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-40 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{t.name}</CardTitle>
                    </div>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px]", CATEGORY_COLORS[t.category] ?? "bg-muted")}>
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 text-xs">
                  <p className="text-muted-foreground">{t.description}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">{t.agentType}</Badge>
                    {t.isCustom && <Badge variant="secondary" className="text-[10px]">سفارشی</Badge>}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={!activeWorkspaceId}
                    onClick={async () => {
                      if (!activeWorkspaceId) return;
                      try {
                        await api("/api/tasks", {
                          method: "POST",
                          body: JSON.stringify({
                            workspaceId: activeWorkspaceId,
                            agentType: t.agentType,
                            type: t.taskType,
                            title: t.name,
                            input: t.instruction,
                          }),
                        });
                        toast.success("وظیفه ایجاد شد");
                        setView("tasks");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    اجرا
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
