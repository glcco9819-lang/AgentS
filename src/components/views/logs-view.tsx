"use client";
import * as React from "react";
import { ScrollText, RefreshCw, Loader2, Info, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
const LEVEL_STYLE: Record<string, { icon: any; cls: string }> = { info: { icon: Info, cls: "text-blue-400" }, warn: { icon: AlertTriangle, cls: "text-amber-400" }, error: { icon: XCircle, cls: "text-destructive" }, debug: { icon: Info, cls: "text-muted-foreground" } };
export function LogsView() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => { setLoading(true); try { const res = await fetch("/api/logs?limit=300"); const data = await res.json(); setLogs(data.logs ?? []); } finally { setLoading(false); } }, []);
  React.useEffect(() => { const t = setTimeout(load, 50); return () => clearTimeout(t); }, [load]);
  return (<div className="flex flex-1 flex-col overflow-hidden"><div className="flex h-12 items-center gap-3 border-b border-border px-4"><ScrollText className="h-4 w-4 text-primary" /><span className="text-sm font-medium">لاگ‌های سیستم</span><Badge variant="outline" className="text-[11px]">{logs.length}</Badge><Button size="icon" variant="ghost" className="ms-auto h-8 w-8" onClick={load} aria-label="بررسی مجدد"><RefreshCw className="h-3.5 w-3.5" /></Button></div>
    <div className="flex-1 overflow-y-auto scroll-thin">{loading ? (<div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>) : logs.length === 0 ? (<div className="py-20 text-center text-sm text-muted-foreground">لاگی نیست.</div>) : (
      <div className="font-mono text-[11px] leading-relaxed">{logs.map((log) => { const style = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info; const Icon = style.icon; return (<div key={log.id} className="flex items-start gap-2.5 border-b border-border/40 px-4 py-2 hover:bg-muted/30"><span className="shrink-0 text-muted-foreground" dir="ltr">{format(new Date(log.createdAt), "HH:mm:ss")}</span><Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", style.cls)} /><Badge variant="outline" className={cn("shrink-0 px-1.5 py-0 text-[9px]", style.cls)}>{log.level}</Badge><span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{log.source}</span><span className="min-w-0 flex-1 break-words" dir="auto">{log.message}</span></div>); })}</div>
    )}</div></div>);
}
