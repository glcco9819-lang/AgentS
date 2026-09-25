"use client";

import * as React from "react";
import { GitBranch, Scan, RefreshCw, Plus, FolderTree } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Env {
  id: string;
  name: string;
  branch: string;
  status: string;
  repoPath: string;
  createdAt: string;
  commits?: Array<{ sha: string; message: string; createdAt: string }>;
}

export function EnvironmentsView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setView = useAppStore((s) => s.setView);
  const [envs, setEnvs] = React.useState<Env[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [scanning, setScanning] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeWorkspaceId ? `?workspaceId=${encodeURIComponent(activeWorkspaceId)}` : "";
      const data = await api<{ environments: Env[] }>(`/api/environments${qs}`);
      setEnvs(data.environments ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const scan = async (id: string) => {
    setScanning(id);
    try {
      const r = await api<{ total: number }>(`/api/environments/${id}/scan`, { method: "POST" });
      toast.success(`اسکن کامل شد — ${r.total} فایل`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setScanning(null);
    }
  };

  const create = async () => {
    if (!activeWorkspaceId) {
      toast.error("ابتدا یک فضای کار انتخاب کنید");
      setView("workspaces");
      return;
    }
    if (!name) {
      toast.error("نام الزامی است");
      return;
    }
    try {
      await api("/api/environments", {
        method: "POST",
        body: JSON.stringify({ workspaceId: activeWorkspaceId, name }),
      });
      toast.success("محیط ایجاد شد");
      setOpen(false);
      setName("");
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
            <h1 className="text-2xl font-bold">محیط‌های مهندسی</h1>
            <p className="text-sm text-muted-foreground">محیط‌های اجرایی با git و ابزار ساخت</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                محیط جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد محیط جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5 py-2">
                <Label>نام محیط</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="env-001" />
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
            {[1, 2].map((i) => <Card key={i} className="h-32 animate-pulse bg-muted/50" />)}
          </div>
        ) : envs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <FolderTree className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm">محیطی ثبت نشده است.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {envs.map((e) => (
              <Card key={e.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{e.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">{e.branch}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="truncate font-mono text-muted-foreground" dir="ltr">{e.repoPath}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{e.status}</Badge>
                    {e.commits && e.commits.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        آخرین کامیت: {e.commits[0].sha.slice(0, 7)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5"
                    disabled={scanning === e.id}
                    onClick={() => scan(e.id)}
                  >
                    {scanning === e.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Scan className="h-3.5 w-3.5" />
                    )}
                    اسکن محیط
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
