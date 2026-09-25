"use client";

import * as React from "react";
import { BookOpen, Download, FileText } from "lucide-react";
import { GUIDE_SECTIONS } from "@/lib/guide-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

export function GuideView() {
  const [activeId, setActiveId] = React.useState(GUIDE_SECTIONS[0].id);
  const active = GUIDE_SECTIONS.find((s) => s.id === activeId) ?? GUIDE_SECTIONS[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h1 className="text-xl font-bold">راهنمای YFG</h1>
          <p className="text-xs text-muted-foreground">معماری، عامل‌ها، خط لوله و حاکمیت</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <a href="/api/guide/pdf">
              <Download className="h-3.5 w-3.5" />
              PDF
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <a href="/api/guide/docx">
              <FileText className="h-3.5 w-3.5" />
              Word
            </a>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto scroll-thin border-l border-border p-2">
          {GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn(
                "block w-full rounded-md px-3 py-2 text-right text-xs transition-colors",
                activeId === s.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{s.title}</span>
              </div>
              <div className="mt-0.5 ps-5 text-[10px] text-muted-foreground">{s.summary}</div>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto scroll-thin p-4 md:p-6">
          <Card className="mx-auto max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                {active.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown content={active.content} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
