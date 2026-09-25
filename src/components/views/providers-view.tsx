"use client";

import * as React from "react";
import { Cpu, Plus, Link2, Check, X } from "lucide-react";
import { api } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  models: Array<{ id: string; name: string; version: string }>;
  bindings: Array<{ agentId: string; modelName?: string | null }>;
}

interface Agent { id: string; name: string; type: string; }

export function ProvidersView() {
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", baseUrl: "", apiKey: "" });
  const [bindings, setBindings] = React.useState<Array<{ agentId: string; providerId: string; modelName?: string | null }>>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, a, b] = await Promise.all([
        api<{ providers: Provider[] }>("/api/providers"),
        api<{ agents: Agent[] }>("/api/agents"),
        api<{ bindings: Array<{ agentId: string; providerId: string; modelName?: string | null }> }>("/api/providers/bindings"),
      ]);
      setProviders(p.providers ?? []);
      setAgents(a.agents ?? []);
      setBindings(b.bindings ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.name || !form.baseUrl) {
      toast.error("نام و baseUrl الزامی است");
      return;
    }
    try {
      await api("/api/providers", { method: "POST", body: JSON.stringify(form) });
      toast.success("ارائه‌دهنده ایجاد شد");
      setOpen(false);
      setForm({ name: "", baseUrl: "", apiKey: "" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const bindAgent = async (agentId: string, providerId: string) => {
    try {
      await api("/api/providers/bindings", {
        method: "POST",
        body: JSON.stringify({ agentId, providerId }),
      });
      toast.success("اتصال انجام شد");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const providerFor = (agentId: string) => bindings.find((b) => b.agentId === agentId)?.providerId ?? "";

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ارائه‌دهنده‌های AI</h1>
            <p className="text-sm text-muted-foreground">مدیریت چند-ارائه‌دهنده و اتصال عامل‌ها</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                ارائه‌دهنده جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد ارائه‌دهنده</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1.5">
                  <Label>نام</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="glm" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>Base URL</Label>
                  <Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.z.ai/api/paas/v4" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>API Key (اختیاری)</Label>
                  <Input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} dir="ltr" type="password" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>لغو</Button>
                <Button onClick={create}>ایجاد</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {loading ? (
            <Card className="h-32 animate-pulse bg-muted/50 sm:col-span-2" />
          ) : providers.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <Cpu className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">ارائه‌دهنده‌ای ثبت نشده است.</p>
                <p className="text-xs text-muted-foreground">در صورت نبود ارائه‌دهنده، از system config استفاده می‌شود.</p>
              </CardContent>
            </Card>
          ) : (
            providers.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-primary" />
                      {p.name}
                    </CardTitle>
                    <Badge variant={p.enabled ? "default" : "secondary"} className="text-[10px]">
                      {p.enabled ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="truncate font-mono text-muted-foreground" dir="ltr">{p.baseUrl}</div>
                  <div className="flex flex-wrap gap-1">
                    {p.models.map((m) => (
                      <Badge key={m.id} variant="outline" className="text-[10px] font-mono" dir="ltr">{m.name}</Badge>
                    ))}
                    {p.models.length === 0 && <span className="text-[10px] text-muted-foreground">بدون مدل</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    {p.bindings.length} اتصال عامل
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ماتریس اتصال عامل‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">عامل</TableHead>
                  <TableHead className="text-xs">نوع</TableHead>
                  <TableHead className="text-xs">ارائه‌دهنده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-medium">{a.name}</TableCell>
                    <TableCell className="text-xs font-mono" dir="ltr">{a.type}</TableCell>
                    <TableCell>
                      <select
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                        value={providerFor(a.id)}
                        onChange={(e) => e.target.value && bindAgent(a.id, e.target.value)}
                      >
                        <option value="">— پیش‌فرض سیستم —</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
