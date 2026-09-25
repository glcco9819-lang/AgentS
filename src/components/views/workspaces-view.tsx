"use client";

import * as React from "react";
import { Plus, FolderTree, FolderOpen, Languages, Zap } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  rootPath: string;
  language?: string | null;
  framework?: string | null;
  status: string;
  vision?: string | null;
  createdAt: string;
  _count?: { tasks: number; artifacts: number };
}

export function WorkspacesView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useAppStore((s) => s.setActiveWorkspaceId);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", rootPath: "", language: "", framework: "", vision: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ workspaces: Workspace[] }>("/api/workspaces");
      setWorkspaces(data.workspaces ?? []);
      if (!activeWorkspaceId && data.workspaces?.length > 0) {
        setActiveWorkspaceId(data.workspaces[0].id);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.name || !form.rootPath) {
      toast.error("نام و مسیر ریشه الزامی است");
      return;
    }
    try {
      await api("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("فضای کار ایجاد شد");
      setOpen(false);
      setForm({ name: "", rootPath: "", language: "", framework: "", vision: "" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">فضاهای کار</h1>
            <p className="text-sm text-muted-foreground">مدیریت پروژه‌ها و فضاهای کاری</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                فضای کار جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد فضای کار جدید</DialogTitle>
                <DialogDescription>یک پروژه جدید برای اجرای pipeline تعریف کنید.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1.5">
                  <Label>نام</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً ERP Core" />
                </div>
                <div className="space-y-1.5">
                  <Label>مسیر ریشه</Label>
                  <Input value={form.rootPath} onChange={(e) => setForm({ ...form, rootPath: e.target.value })} placeholder="/projects/erp" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>زبان</Label>
                    <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="typescript" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>فریم‌ورک</Label>
                    <Input value={form.framework} onChange={(e) => setForm({ ...form, framework: e.target.value })} placeholder="nextjs" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>چشم‌انداز</Label>
                  <Input value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} placeholder="توضیح کوتاه" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>لغو</Button>
                <Button onClick={create}>ایجاد</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <FolderTree className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">هنوز فضای کاری ثبت نشده است</p>
              <p className="text-xs text-muted-foreground">برای شروع، یک فضای کار جدید ایجاد کنید.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((w) => (
              <Card
                key={w.id}
                className={`cursor-pointer transition-all hover:shadow-md ${activeWorkspaceId === w.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setActiveWorkspaceId(w.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{w.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{w.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                    {w.rootPath}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {w.language && (
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Languages className="h-3 w-3" />
                        {w.language}
                      </span>
                    )}
                    {w.framework && (
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Zap className="h-3 w-3" />
                        {w.framework}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span>{w._count?.tasks ?? 0} وظیفه</span>
                    <span>{w._count?.artifacts ?? 0} خروجی</span>
                  </div>
                  {activeWorkspaceId === w.id && (
                    <Badge variant="default" className="text-[10px]">فعال</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
