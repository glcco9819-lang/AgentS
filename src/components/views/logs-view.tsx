"use client";

import * as React from "react";
import { ScrollText, RefreshCw, Loader2, Trash2, Info, AlertTriangle, XCircle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface LogRow {
  id: string;
  level: string;
  source: string;
  message: string;
  meta: string | null;
  createdAt: string;
}

const LEVEL_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; badge: string }> = {
  info: { icon: Info, cls: "text-blue-400", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  warn: { icon: AlertTriangle, cls: "text-amber-400", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  error: { icon: XCircle, cls: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  debug: { icon: Bug, cls: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

export function LogsView() {
  const [logs, setLogs] = React.useState<LogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [level, setLevel] = React.useState<string>("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = level === "all" ? "/api/logs?limit=300" : `/api/logs?level=${level}&limit=300`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } finally {
      setLoading(false);
    }
  }, [level]);

  React.useEffect(() => {
    const t = setTimeout(load, 50);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-12 items-center gap-3 border-b border-border px-4">
        <ScrollText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">لاگ‌های سیستم</span>
        <Badge variant="outline" className="text-[11px]">{logs.length} رکورد</Badge>
        <div className="ms-auto flex items-center gap-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warn">warn</SelectItem>
              <SelectItem value="error">error</SelectItem>
              <SelectItem value="debug">debug</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={load} aria-label="بررسی مجدد">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
            <Trash2 className="mb-2 h-6 w-6 opacity-40" />
            هیچ لاگی یافت نشد
          </div>
        ) : (
          <div className="font-mono text-[11px] leading-relaxed">
            {logs.map((log) => {
              const style = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info;
              const Icon = style.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 border-b border-border/40 px-4 py-2 hover:bg-muted/30"
                >
                  <span className="shrink-0 text-muted-foreground" dir="ltr">
                    {format(new Date(log.createdAt), "HH:mm:ss")}
                  </span>
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", style.cls)} />
                  <Badge variant="outline" className={cn("shrink-0 px-1.5 py-0 text-[9px] font-medium", style.badge)}>
                    {log.level}
                  </Badge>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {log.source}
                  </span>
                  <span className="min-w-0 flex-1 break-words" dir="auto">
                    {log.message}
                    {log.meta && (
                      <span className="ms-1 text-muted-foreground" dir="ltr">
                        {log.meta}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
