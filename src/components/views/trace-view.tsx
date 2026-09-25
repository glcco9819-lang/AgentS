"use client";
import * as React from "react";
import { Network, Loader2, ArrowLeft, Link2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export function TraceView() {
  const { activeWorkspaceId, setView } = useAppStore();
  const [chain, setChain] = React.useState<{ links: any[]; roots: string[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => { if (!activeWorkspaceId) { setChain(null); setLoading(false); return; } setLoading(true); try { const res = await fetch(`/api/trace?workspaceId=${activeWorkspaceId}`); const data = await res.json(); setChain({ links: data.links ?? [], roots: data.roots ?? [] }); } finally { setLoading(false); } }, [activeWorkspaceId]);
  React.useEffect(() => { load(); }, [load]);
  if (!activeWorkspaceId) return (<div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center"><Network className="mb-3 h-14 w-14 text-primary/40" /><h2 className="text-lg font-semibold">ورک‌اسپیسی فعال نیست</h2><Button onClick={() => setView("workspaces")} className="mt-4 gap-2">رفتن به ورک‌اسپیس‌ها <ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Button></div>);
  return (<div className="flex-1 overflow-y-auto scroll-thin"><div className="mx-auto w-full max-w-4xl px-4 py-6"><h1 className="flex items-center gap-2 text-xl font-bold mb-1"><Network className="h-5 w-5 text-primary" /> زنجیره ردیابی</h1><p className="text-sm text-muted-foreground mb-6">هر artifact قابل ردیابی است (اصل ۰۴).</p>
    {loading ? (<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>) : !chain || chain.links.length === 0 ? (<div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">زنجیره‌ای ساخته نشده.</div>) : (
      <div className="space-y-2"><div className="mb-3 text-xs text-muted-foreground">{chain.links.length} لینک · {chain.roots.length} ریشه</div>{chain.links.map((l) => (<Card key={l.id}><CardContent className="flex items-center gap-3 p-3"><Link2 className="h-4 w-4 shrink-0 text-primary" /><div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[11px]" dir="ltr"><Badge variant="outline" className="text-[9px]">{l.sourceType}</Badge><span className="truncate">{l.sourceId.slice(-8)}</span><span className="text-muted-foreground">—{l.relation}→</span><Badge variant="secondary" className="text-[9px]">{l.targetType}</Badge><span className="truncate">{l.targetId.slice(-8)}</span></div></CardContent></Card>))}</div>)}</div></div>);
}
