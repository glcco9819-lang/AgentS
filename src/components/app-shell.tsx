"use client";

import * as React from "react";
import {
  MessageSquare,
  FolderTree,
  ScanSearch,
  Network,
  Settings as SettingsIcon,
  ScrollText,
  Cpu,
  Menu,
  Github,
} from "lucide-react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ChatView } from "@/components/views/chat-view";
import { ProjectsView } from "@/components/views/projects-view";
import { AnalysisView } from "@/components/views/analysis-view";
import { ArchitectureView } from "@/components/views/architecture-view";
import { SettingsView } from "@/components/views/settings-view";
import { LogsView } from "@/components/views/logs-view";
import { GatewayStatus } from "@/components/gateway-status";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const NAV: NavItem[] = [
  { key: "chat", label: "گفت‌وگو", icon: MessageSquare, desc: "Chat با مدل" },
  { key: "projects", label: "پروژه‌ها", icon: FolderTree, desc: "مدیریت پروژه" },
  { key: "analysis", label: "تحلیل کد", icon: ScanSearch, desc: "Code Analysis" },
  { key: "architecture", label: "معماری", icon: Network, desc: "Architecture Review" },
  { key: "settings", label: "تنظیمات", icon: SettingsIcon, desc: "AI Gateway" },
  { key: "logs", label: "لاگ‌ها", icon: ScrollText, desc: "System Logs" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView } = useAppStore();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              setView(item.key);
              onNavigate?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="flex-1 text-right">{item.label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Cpu className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">Local AI</div>
          <div className="text-[11px] text-muted-foreground">Project Assistant</div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Badge variant="secondary" className="w-full justify-center gap-1.5 py-1 text-[11px]">
          V0.1 · UI + Chat + LLM
        </Badge>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto scroll-thin">
        <NavLinks />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <GatewayStatus />
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { view } = useAppStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">دستیار پروژه‌ی هوش مصنوعی محلی</span>
        </div>

        <div className="ms-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">سورس</span>
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-l border-sidebar-border bg-sidebar md:block">
          <SidebarBody />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {view === "chat" && <ChatView />}
          {view === "projects" && <ProjectsView />}
          {view === "analysis" && <AnalysisView />}
          {view === "architecture" && <ArchitectureView />}
          {view === "settings" && <SettingsView />}
          {view === "logs" && <LogsView />}
        </main>
      </div>

      {/* Footer — always pinned to viewport bottom (app shell pattern) */}
      <footer className="shrink-0 border-t border-border bg-background/80 px-4 py-2.5 text-[11px] text-muted-foreground backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <span>
            معماری مستقل از LLM · AI Gateway → OpenAI-compatible · Project Intelligence جدای از مدل
          </span>
          <span className="font-mono">V0.1 · 7-phase roadmap</span>
        </div>
      </footer>
    </div>
  );
}
