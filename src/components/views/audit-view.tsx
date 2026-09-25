"use client";
import * as React from "react";
import { ScrollText, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
export function AuditView() {
  const { activeWorkspaceId } = useAppStore();
  const [audits, setAudits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => {
    setLoading(true);
    try { const url = activeWorkspaceId ? `/api/audit?workspaceId=${activeWorkspaceId}&limit=300` : "/api/audit?limit=300"; const res = await fetch(url); const data = await res.json(); setAudits(data.audits ?? []); } finally { setLoading(false); }
  }, [activeWorkspaceId]);
  React.useEffect(() => { load(); }, [load]);
  return (<div className="flex flex-1 flex-col overflow-hidden"><div className="flex h-12 items-center gap-3 border-b border-border px-4"><ScrollText className="h-4 w-4 text-primary" /><span className="text-sm font-medium">سوابق حسابرسی</span><Badge variant="outline" className="text-[11px]">{audits.length}</Badge></div>
    <div className="flex-1 overflow-y-auto scroll-thin">{loading ? (<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>) : audits.length === 0 ? (<div className="py-20 text-center text-sm text-muted-foreground">سوابی ثبت نشده.</div>) : (
      <div className="font-mono text-[11px] leading-relaxed">{audits.map((a) => (<div key={a.id} className="flex items-start gap-2.5 border-b border-border/40 px-4 py-2 hover:bg-muted/30"><span className="shrink-0 text-muted-foreground" dir="ltr">{format(new Date(a.createdAt), "HH:mm:ss")}</span><Badge variant="outline" className="shrink-0 text-[9px]">{a.action}</Badge><span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{a.actor}</span><span className="min-w-0 flex-1 break-words" dir="auto">{a.targetType}/{a.targetId.slice(-10)}{a.meta && <span className="ms-1 text-muted-foreground" dir="ltr">{JSON.stringify(a.meta).slice(0,100)}</span>}</span>{a.hash && <span className="shrink-0 text-[9px] text-primary" dir="ltr">#{a.hash.slice(-8)}</span>}</div>))}</div>
    )}</div></div>);
}
