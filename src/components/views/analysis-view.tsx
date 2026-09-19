"use client";

import { ScanSearch, FileCode2, ShieldCheck, Zap, Copy, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

const FEATURES = [
  { icon: FileCode2, title: "Code Review", desc: "شناسایی باگ، مشکلات امنیتی، کارایی، کد تکراری و نقض معماری" },
  { icon: ScanSearch, title: "Semantic Search", desc: "RAG Engine برای یافتن بخش‌های مرتبط حتی بدون تطابق دقیق عبارت" },
  { icon: ShieldCheck, title: "Security Audit", desc: "بررسی وابستگی‌ها و الگوهای ناامن در کل پروژه" },
  { icon: Zap, title: "Performance", desc: "نقاط گلوگاه و پیشنهاد بهینه‌سازی مبتنی بر Context" },
];

export function AnalysisView() {
  const { setView } = useAppStore();
  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Badge variant="secondary" className="mb-2 gap-1">
            <ScanSearch className="h-3 w-3" />
            فاز V0.5
          </Badge>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <ScanSearch className="h-5 w-5 text-primary" />
            تحلیل کد
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            موتور تحلیل کد هوشمند — متصل به Context Engine و RAG. این بخش پس از فعال‌سازی
            Scanner و File Index در فازهای V0.2 و V0.4 آماده می‌شود.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Copy className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold">به‌زودی در دسترس</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            تحلیل کد به File Index، Context Engine و RAG وابسته است. پس از تکمیل این
            زیرساخت‌ها، تحلیل خودکار باگ/امنیت/کارایی فعال خواهد شد.
          </p>
          <button
            onClick={() => setView("chat")}
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            تا آن زمان با Chat شروع کنید
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="opacity-70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold">نقشه‌ی راه</h3>
          <div className="space-y-2">
            {[
              { v: "V0.1", t: "UI + اتصال به LLM + Chat", done: true },
              { v: "V0.2", t: "Project Folder + File Scanner", done: false },
              { v: "V0.3", t: "File Index + Context Engine", done: false },
              { v: "V0.4", t: "RAG + Semantic Search", done: false },
              { v: "V0.5", t: "Code/SQL/Architecture Analysis", done: false, current: true },
              { v: "V0.6", t: "Change Preview + Safe Editing", done: false },
              { v: "V1.0", t: "Multi-Project + Plugins", done: false },
            ].map((s) => (
              <div
                key={s.v}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <Badge variant={s.done ? "default" : "outline"} className="font-mono text-[10px]">
                  {s.v}
                </Badge>
                <span className="flex-1 text-xs">{s.t}</span>
                {s.done && <span className="text-[10px] text-primary">✓ تکمیل‌شده</span>}
                {s.current && <span className="text-[10px] text-muted-foreground">← اینجا</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
