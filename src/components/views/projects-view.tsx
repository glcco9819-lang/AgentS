"use client";

import * as React from "react";
import {
  FolderTree,
  Plus,
  Trash2,
  FolderOpen,
  Loader2,
  FileCode2,
  MessagesSquare,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  rootPath: string;
  language: string | null;
  framework: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastScanAt: string | null;
  _count?: { sessions: number; fileIndex: number };
}

const LANGUAGES = ["csharp", "typescript", "javascript", "python", "java", "go", "php", "sql"];
const FRAMEWORKS = ["dotnet", "nextjs", "react", "vue", "node", "django", "laravel", "other"];

export function ProjectsView() {
  const { toast } = useToast();
  const { setActiveProjectId, setView } = useAppStore();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    rootPath: "",
    language: "csharp",
    framework: "dotnet",
    note: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.name.trim() || !form.rootPath.trim()) {
      toast({ title: "نام و مسیر پروژه الزامی است", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "خطا در ثبت پروژه");
      }
      toast({ title: "پروژه ثبت شد", description: "اسکن فایل در فاز V0.2 فعال خواهد شد." });
      setForm({ name: "", rootPath: "", language: "csharp", framework: "dotnet", note: "" });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  const openChatFor = (p: Project) => {
    setActiveProjectId(p.id);
    setView("chat");
  };

  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <FolderTree className="h-5 w-5 text-primary" />
              پروژه‌ها
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              پروژه‌های نرم‌افزاری را ثبت کنید. File Scanner و File Index در فاز V0.2 به این
              بخش متصل می‌شوند و در V0.3 Context Engine فعال خواهد شد.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                پروژه‌ی جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>ثبت پروژه</DialogTitle>
                <DialogDescription>
                  مسیر پوشه‌ی پروژه را وارد کنید. اسکن فایل‌ها در فاز بعدی انجام می‌شود.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">نام پروژه</Label>
                  <Input
                    id="p-name"
                    placeholder="مثلاً ERP Core"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-path">مسیر ریشه (Root Path)</Label>
                  <Input
                    id="p-path"
                    dir="ltr"
                    className="font-mono text-xs"
                    placeholder="C:\\YFG\\ERP"
                    value={form.rootPath}
                    onChange={(e) => setForm({ ...form, rootPath: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>زبان</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>فریم‌ورک</Label>
                    <Select value={form.framework} onValueChange={(v) => setForm({ ...form, framework: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FRAMEWORKS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-note">یادداشت (اختیاری)</Label>
                  <Input
                    id="p-note"
                    placeholder="توضیح کوتاه"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
                <Button onClick={submit} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  ثبت
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="group relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {p.language && (
                            <Badge variant="secondary" className="text-[10px]">{p.language}</Badge>
                          )}
                          {p.framework && (
                            <Badge variant="outline" className="text-[10px]">{p.framework}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={p.rootPath}>
                    {p.rootPath}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3.5 w-3.5" />
                      {p._count?.fileIndex ?? 0} فایل ایندکس‌شده
                    </span>
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="h-3.5 w-3.5" />
                      {p._count?.sessions ?? 0} گفت‌وگو
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: faIR })}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => openChatFor(p)}>
                      <MessagesSquare className="h-3.5 w-3.5" />
                      گفت‌وگو
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">اصل معماری:</span>{" "}
              Project Intelligence (Scanner / Parser / Indexer / Context Retrieval) کاملاً مستقل
              از LLM است. این یعنی اگر فردا GLM با Qwen یا Llama جایگزین شود، کل لایه‌ی پروژه
              دست‌نخورده باقی می‌ماند.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    registered: { label: "ثبت‌شده", cls: "bg-secondary text-secondary-foreground" },
    scanning: { label: "در حال اسکن", cls: "bg-primary/15 text-primary" },
    indexed: { label: "ایندکس‌شده", cls: "bg-primary/15 text-primary" },
    error: { label: "خطا", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status] ?? map.registered;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

function EmptyProjects() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <FolderTree className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-medium">هنوز پروژه‌ای ثبت نشده</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        با دکمه‌ی «پروژه‌ی جدید» اولین پروژه را اضافه کنید. مثلاً مسیر
        <span className="font-mono" dir="ltr"> C:\YFG\ERP </span>
      </p>
    </div>
  );
}
