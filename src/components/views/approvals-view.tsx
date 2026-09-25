"use client";

import * as React from "react";
import { CheckSquare, Check, X, Clock } from "lucide-react";
import { api } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Approval {
  id: string;
  taskId: string;
  gateType: string;
  status: string;
  comment?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  task?: { title: string } | null;
}

export function ApprovalsView() {
  const [approvals, setApprovals] = React.useState<Approval[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [comment, setComment] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ approvals: Approval[] }>("/api/approvals?pending=true");
      setApprovals(data.approvals ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await api("/api/approvals", {
        method: "POST",
        body: JSON.stringify({
          approvalId: id,
          decision,
          decidedBy: "admin",
          comment: comment[id] ?? "",
        }),
      });
      toast.success(decision === "approved" ? "تأیید شد" : "رد شد");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">تأییدهای در انتظار</h1>
          <p className="text-sm text-muted-foreground">تصمیم‌های انسانی در انتظار</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" />
              صف تأیید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[60vh]">
              {loading ? (
                <div className="h-32 animate-pulse rounded bg-muted/50" />
              ) : approvals.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">تأییدی در انتظار نیست.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((a) => (
                    <div key={a.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{a.task?.title ?? a.taskId}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono" dir="ltr">{a.gateType}</span>
                            <span>·</span>
                            <span>{new Date(a.createdAt).toLocaleString("fa-IR")}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">توضیح (اختیاری)</Label>
                        <Textarea
                          rows={2}
                          className="text-xs"
                          value={comment[a.id] ?? ""}
                          onChange={(e) => setComment({ ...comment, [a.id]: e.target.value })}
                          placeholder="توضیح تصمیم…"
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => decide(a.id, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
                          onClick={() => decide(a.id, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          رد
                        </Button>
                      </div>
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
