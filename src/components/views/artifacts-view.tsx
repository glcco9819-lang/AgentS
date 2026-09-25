"use client";

import * as React from "react";
import { FileText, RefreshCw } from "lucide-react";
import { api } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

interface Artifact {
  id: string;
  name: string;
  type: string;
  path?: string | null;
  content: string;
  createdAt: string;
  version: number;
}

export function ArtifactsView() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const [artifacts, setArtifacts] = React.useState<Artifact[]>([]);
  const [selected, setSelected] = React.useState<Artifact | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeWorkspaceId ? `?workspaceId=${encodeURIComponent(activeWorkspaceId)}` : "";
      const data = await api<{ artifacts: Artifact[] }>(`/api/artifacts${qs}`);
      setArtifacts(data.artifacts ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const select = async (id: string) => {
    try {
      const data = await api<{ artifact: Artifact }>(`/api/artifacts/${id}`);
      setSelected(data.artifact);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h1 className="text-xl font-bold">خروجی‌ها</h1>
            <p className="text-xs text-muted-foreground">artifactهای تولیدشده توسط عامل‌ها</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            به‌روزرسانی
          </Button>
        </header>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Card key={i} className="h-16 animate-pulse bg-muted/50" />)}
              </div>
            ) : artifacts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">خروجی‌ای موجود نیست.</p>
                </CardContent>
              </Card>
            ) : (
              artifacts.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:shadow-sm" onClick={() => select(a.id)}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-mono" dir="ltr">{a.type}</span> · v{a.version}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {selected && (
        <aside className="hidden w-96 shrink-0 overflow-y-auto border-s border-border p-4 lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{selected.name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">{selected.type}</Badge>
                <Badge variant="secondary" className="text-[10px]">v{selected.version}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {selected.type === "markdown" ? (
                <Markdown content={selected.content} />
              ) : (
                <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-[11px]" dir="ltr">{selected.content.slice(0, 5000)}</pre>
              )}
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
}
