"use client";

import * as React from "react";
import { Network, Layers, GitBranch, Workflow, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

const PIPELINE = [
  "Project",
  "Scanner",
  "Parser",
  "Indexer",
  "Context",
  "AI Analysis",
  "Architecture Graph",
];

export function ArchitectureView() {
  const { setView } = useAppStore();
  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Badge variant="secondary" className="mb-2 gap-1">
            <Network className="h-3 w-3" />
            فاز V0.5
          </Badge>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Network className="h-5 w-5 text-primary" />
            بازبینی معماری
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحلیل خودکار وابستگی‌ها، لایه‌ها، ماژول‌ها و نقاط اتصال پروژه و تولید Graph معماری.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Workflow className="h-4 w-4 text-primary" />
              Pipeline معماری
            </CardTitle>
            <CardDescription className="text-xs">
              جریان داده از پروژه تا تحلیل معماری
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2" dir="ltr">
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 font-mono text-[11px]">
                    {step}
                  </span>
                  {i < PIPELINE.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold">به‌زودی در دسترس</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            بازبینی معماری پس از فعال‌سازی File Scanner و Context Engine در فازهای V0.2 و
            V0.3 آماده می‌شود. اصل کلیدی: Project Intelligence مستقل از LLM باقی می‌ماند.
          </p>
          <button
            onClick={() => setView("chat")}
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            با Chat ادامه دهید
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: GitBranch, t: "Dependency Graph", d: "نقشه‌ی وابستگی ماژول‌ها" },
            { icon: Layers, t: "Layer Analysis", d: "بررسی جداسازی لایه‌ها" },
            { icon: Network, t: "Architecture Graph", d: "گراف بصری معماری" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.t} className="opacity-70">
                <CardHeader className="pb-3">
                  <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm">{f.t}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{f.d}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
