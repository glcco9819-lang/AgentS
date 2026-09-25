"use client";

import * as React from "react";
import { Gate as GateIcon, ShieldAlert, RefreshCw } from "lucide-react";
import { api } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Gate {
  id: string;
  taskId: string;
  decision: string;
  reason?: string | null;
  requiresHuman: boolean;
  createdAt: string;
  verification?: { type: string; result: string } | null;
}

export function GatesView() {
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ gates: Gate[] }>("/api/gates");
      setGates(data.gates ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const DECISION_COLORS: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    "needs-human": "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">دروازه‌های کیفیت</h1>
            <p className="text-sm text-muted-foreground">تصمیم‌های دروازه پس از تأیید</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            به‌روزرسانی
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GateIcon className="h-4 w-4 text-primary" />
              تصمیم‌ها
            </CardTitle>
            <CardDescription className="text-xs">
              هر دروازه پس از اجرای تأیید، تصمیم می‌گیرد: تأیید / رد / نیاز به انسان
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[60vh]">
              {loading ? (
                <div className="h-32 animate-pulse rounded bg-muted/50" />
              ) : gates.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">دروازه‌ای ثبت نشده است.</div>
              ) : (
                <div className="space-y-2">
                  {gates.map((g) => (
                    <div key={g.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2">
                        <GateIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs" dir="ltr">task:{g.taskId.slice(0, 8)}</span>
                        <Badge className={cn("ms-auto text-[10px]", DECISION_COLORS[g.decision] ?? "")}>
                          {g.decision}
                        </Badge>
                      </div>
                      {g.reason && <p className="mt-1 text-xs text-muted-foreground">{g.reason}</p>}
                      {g.requiresHuman && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3 w-3" />
                          نیاز به تأیید انسانی
                        </div>
                      )}
                      {g.verification && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          تأیید مرتبط: <span className="font-mono" dir="ltr">{g.verification.type}</span> → {g.verification.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
