"use client";

import * as React from "react";
import { ScanSearch, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

const ANALYSIS_KINDS = [
  { id: "code-quality", label: "کیفیت کد" },
  { id: "architecture", label: "معماری" },
  { id: "security", label: "امنیت" },
  { id: "performance", label: "کارایی" },
  { id: "tech-debt", label: "بدهی فنی" },
];

export function AnalysisView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const [kind, setKind] = React.useState<string>("code-quality");
  const [prompt, setPrompt] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [envs, setEnvs] = React.useState<Array<{ id: string; name: string }>>([]);
  const [envId, setEnvId] = React.useState("");

  React.useEffect(() => {
    if (!activeWorkspaceId) return;
    api<{ environments: Array<{ id: string; name: string }> }>(`/api/environments?workspaceId=${activeWorkspaceId}`)
      .then((d) => setEnvs(d.environments ?? []))
      .catch(() => {});
  }, [activeWorkspaceId]);

  const run = async () => {
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmentId: envId || undefined,
          workspaceId: activeWorkspaceId,
          kind,
          prompt,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.delta) setOutput((prev) => prev + data.delta);
              if (data.error) {
                toast.error(data.error);
              }
              if (data.done) {
                toast.success("تحلیل کامل شد");
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
      setOutput(`**خطا:** ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border p-4">
        <h1 className="text-xl font-bold">تحلیل کد</h1>
        <p className="text-xs text-muted-foreground">تحلیل هوشمند با زمینه‌ی هوشمندی پروژه</p>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 space-y-3 overflow-y-auto scroll-thin border-l border-border p-4">
          <div>
            <Label className="text-xs">نوع تحلیل</Label>
            <div className="mt-1.5 grid gap-1">
              {ANALYSIS_KINDS.map((k) => (
                <Button
                  key={k.id}
                  size="sm"
                  variant={kind === k.id ? "default" : "outline"}
                  className="justify-start text-xs"
                  onClick={() => setKind(k.id)}
                >
                  {k.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">محیط (اختیاری)</Label>
            <select
              className="mt-1.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
            >
              <option value="">بدون محیط</option>
              {envs.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">تمرکز تحلیل (اختیاری)</Label>
            <Textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثلاً: بررسی کارایی APIها…"
              className="mt-1.5 text-xs"
            />
          </div>

          <Button className="w-full gap-1.5" disabled={running} onClick={run}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            {running ? "در حال تحلیل…" : "اجرا"}
          </Button>
        </aside>

        <main className="flex-1 overflow-y-auto scroll-thin p-4">
          <Card className="mx-auto max-w-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">خروجی تحلیل</CardTitle>
            </CardHeader>
            <CardContent>
              {output ? (
                <Markdown content={output} />
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <p className="text-xs">برای شروع تحلیل، یک نوع را انتخاب و دکمه‌ی اجرا را بزنید.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
