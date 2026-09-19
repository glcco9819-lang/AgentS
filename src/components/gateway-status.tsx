"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "idle" | "checking" | "ok" | "error";

interface HealthResult {
  ok: boolean;
  model?: string;
  error?: string;
}

export function GatewayStatus() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [model, setModel] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const check = React.useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch("/api/health");
      const data: HealthResult = await res.json();
      if (data.ok) {
        setStatus("ok");
        setModel(data.model ?? "");
        setError("");
      } else {
        setStatus("error");
        setError(data.error ?? "Unknown error");
      }
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  const icon = {
    idle: <Loader2 className="h-3.5 w-3.5 text-muted-foreground" />,
    checking: <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />,
    ok: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
    error: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  }[status];

  const label = {
    idle: "بررسی اتصال…",
    checking: "در حال بررسی…",
    ok: "متصل",
    error: "خطا",
  }[status];

  return (
    <div className="rounded-lg border border-sidebar-border bg-card/50 p-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="ms-auto h-6 w-6"
          onClick={check}
          aria-label="بررسی مجدد"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      {status === "ok" && (
        <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground" dir="ltr">
          {model}
        </div>
      )}
      {status === "error" && (
        <div
          className={cn(
            "mt-1 max-h-16 overflow-y-auto scroll-thin",
            "text-[10px] leading-relaxed text-destructive/80"
          )}
          dir="ltr"
        >
          {error}
        </div>
      )}
    </div>
  );
}
