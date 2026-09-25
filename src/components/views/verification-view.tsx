"use client";

import * as React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Play } from "lucide-react";
import { api } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Verification {
  id: string;
  taskId: string;
  artifactId: string;
  type: string;
  result: string;
  report?: string | null;
  checkedBy?: string | null;
  createdAt: string;
}

const RESULT_COLORS: Record<string, string> = {
  pass: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  fail: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  skip: "bg-muted text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
};

const RESULT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pass: CheckCircle2,
  fail: XCircle,
  warn: AlertTriangle,
  skip: ShieldCheck,
  pending: ShieldCheck,
};

export function VerificationView() {
  const [verifications, setVerifications] = React.useState<Verification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ verifications: Verification[] }>("/api/verification");
      setVerifications(data.verifications ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const stats = {
    total: verifications.length,
    pass: verifications.filter((v) => v.result === "pass").length,
    fail: verifications.filter((v) => v.result === "fail").length,
    warn: verifications.filter((v) => v.result === "warn").length,
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">تأیید کیفیت</h1>
          <p className="text-sm text-muted-foreground">نتایج verifierها و یافته‌ها</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground">کل</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground">موفق</div>
              <div className="text-2xl font-bold text-emerald-500">{stats.pass}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground">هشدار</div>
              <div className="text-2xl font-bold text-amber-500">{stats.warn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground">ناموفق</div>
              <div className="text-2xl font-bold text-rose-500">{stats.fail}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              فهرست تأییدها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[60vh]">
              {loading ? (
                <div className="h-32 animate-pulse rounded bg-muted/50" />
              ) : verifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  هنوز تأیدی ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-2">
                  {verifications.map((v) => {
                    const Icon = RESULT_ICONS[v.result] ?? ShieldCheck;
                    return (
                      <div key={v.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", v.result === "fail" ? "text-rose-500" : v.result === "warn" ? "text-amber-500" : v.result === "pass" ? "text-emerald-500" : "text-muted-foreground")} />
                          <span className="font-mono text-sm" dir="ltr">{v.type}</span>
                          <Badge className={cn("ms-auto text-[10px]", RESULT_COLORS[v.result] ?? "")}>{v.result}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>task: <span className="font-mono" dir="ltr">{v.taskId.slice(0, 8)}</span></span>
                          <span>·</span>
                          <span>{new Date(v.createdAt).toLocaleString("fa-IR")}</span>
                          {v.checkedBy && (
                            <>
                              <span>·</span>
                              <span className="font-mono" dir="ltr">{v.checkedBy}</span>
                            </>
                          )}
                        </div>
                        {v.report && (
                          <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-[10px]" dir="ltr">
                            {v.report.slice(0, 500)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
