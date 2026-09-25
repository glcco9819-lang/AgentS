"use client";

import * as React from "react";
import { Network, Layers, Flame, Loader2, Play } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

interface Layer { name: string; files: number; languages: string[]; }
interface Hotspot { path: string; size: number; inDegree: number; }

export function ArchitectureView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const [envs, setEnvs] = React.useState<Array<{ id: string; name: string }>>([]);
  const [envId, setEnvId] = React.useState("");
  const [layers, setLayers] = React.useState<Layer[]>([]);
  const [hotspots, setHotspots] = React.useState<Hotspot[]>([]);
  const [aiReview, setAiReview] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [focus, setFocus] = React.useState("");

  React.useEffect(() => {
    if (!activeWorkspaceId) return;
    api<{ environments: Array<{ id: string; name: string }> }>(`/api/environments?workspaceId=${activeWorkspaceId}`)
      .then((d) => setEnvs(d.environments ?? []))
      .catch(() => {});
  }, [activeWorkspaceId]);

  const run = async () => {
    setRunning(true);
    setAiReview("");
    setLayers([]);
    setHotspots([]);
    try {
      const r = await api<{
        layers: Layer[];
        hotspots: Hotspot[];
        aiReview: string;
      }>("/api/architecture/review", {
        method: "POST",
        body: JSON.stringify({
          environmentId: envId || undefined,
          workspaceId: activeWorkspaceId,
          focus,
        }),
      });
      setLayers(r.layers ?? []);
      setHotspots(r.hotspots ?? []);
      setAiReview(r.aiReview ?? "");
      toast.success("بازبینی معماری کامل شد");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border p-4">
        <h1 className="text-xl font-bold">بازبینی معماری</h1>
        <p className="text-xs text-muted-foreground">تحلیل لایه‌ها، نقاط داغ و بررسی هوش مصنوعی</p>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 space-y-3 overflow-y-auto scroll-thin border-l border-border p-4">
          <div>
            <Label className="text-xs">محیط</Label>
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
            <Label className="text-xs">تمرکز</Label>
            <input
              className="mt-1.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="مثلاً: coupling"
              dir="ltr"
            />
          </div>
          <Button className="w-full gap-1.5" disabled={running} onClick={run}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "در حال بررسی…" : "اجرای بازبینی"}
          </Button>
        </aside>

        <main className="flex-1 overflow-y-auto scroll-thin p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-primary" />
                  لایه‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {layers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">برای مشاهده، بازبینی را اجرا کنید.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {layers.map((l) => (
                      <div key={l.name} className="rounded-md border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm" dir="ltr">{l.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{l.files} فایل</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {l.languages.map((lng) => (
                            <Badge key={lng} variant="outline" className="text-[10px]">{lng}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-amber-500" />
                  نقاط داغ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hotspots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">بدون داده.</p>
                ) : (
                  <div className="space-y-1">
                    {hotspots.map((h) => (
                      <div key={h.path} className="flex items-center justify-between gap-2 rounded border border-border p-2 text-xs">
                        <span className="truncate font-mono" dir="ltr">{h.path}</span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{(h.size / 1024).toFixed(1)}KB</span>
                          <span>درجه: {h.inDegree}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {aiReview && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4 text-primary" />
                    بررسی هوش مصنوعی
                  </CardTitle>
                  <CardDescription className="text-xs">تحلیل تخصصی معماری</CardDescription>
                </CardHeader>
                <CardContent>
                  <Markdown content={aiReview} />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
