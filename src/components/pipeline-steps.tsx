"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStepDef {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
}

export function PipelineSteps({ steps }: { steps: PipelineStepDef[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2" dir="rtl">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              s.status === "done" && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              s.status === "running" && "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse",
              s.status === "failed" && "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300",
              s.status === "pending" && "border-border bg-muted text-muted-foreground",
              s.status === "skipped" && "border-dashed border-border bg-transparent text-muted-foreground opacity-60"
            )}
          >
            {s.status === "done" && <Check className="h-3 w-3" />}
            {s.status === "running" && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {s.status === "failed" && <span className="text-xs">✗</span>}
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-4 bg-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
