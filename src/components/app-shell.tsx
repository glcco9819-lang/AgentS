"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FolderTree,
  LayoutTemplate,
  ListTodo,
  BookOpen,
  GitBranch,
  ScanSearch,
  Network,
  Cpu,
  Users,
  FileText,
  ShieldCheck,
  Gate,
  CheckSquare,
  GitLink,
  ScrollText,
  Settings,
  Terminal,
  Menu,
  LogOut,
  Boxes,
  X,
} from "lucide-react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ActiveWorkspaceBadge } from "@/components/active-workspace-badge";
import { GatewayStatus } from "@/components/gateway-status";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { ControlView } from "@/components/views/control-view";
import { WorkspacesView } from "@/components/views/workspaces-view";
import { TemplatesView } from "@/components/views/templates-view";
import { TasksView } from "@/components/views/tasks-view";
import { GuideView } from "@/components/views/guide-view";
import { EnvironmentsView } from "@/components/views/environments-view";
import { AnalysisView } from "@/components/views/analysis-view";
import { ArchitectureView } from "@/components/views/architecture-view";
import { ProvidersView } from "@/components/views/providers-view";
import { UsersView } from "@/components/views/users-view";
import { ArtifactsView } from "@/components/views/artifacts-view";
import { VerificationView } from "@/components/views/verification-view";
import { GatesView } from "@/components/views/gates-view";
import { ApprovalsView } from "@/components/views/approvals-view";
import { TraceView } from "@/components/views/trace-view";
import { AuditView } from "@/components/views/audit-view";
import { SettingsView } from "@/components/views/settings-view";
import { LogsView } from "@/components/views/logs-view";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "اصلی",
    items: [
      { key: "control", label: "داشبورد", icon: LayoutDashboard },
      { key: "workspaces", label: "فضاهای کار", icon: FolderTree },
      { key: "templates", label: "قالب‌ها", icon: LayoutTemplate },
      { key: "tasks", label: "وظایف", icon: ListTodo },
      { key: "guide", label: "راهنما", icon: BookOpen },
    ],
  },
  {
    title: "تعریف و اجرا",
    items: [
      { key: "environments", label: "محیط‌ها", icon: GitBranch },
      { key: "analysis", label: "تحلیل", icon: ScanSearch },
      { key: "architecture", label: "معماری", icon: Network },
      { key: "providers", label: "ارائه‌دهنده‌ها", icon: Cpu },
      { key: "artifacts", label: "خروجی‌ها", icon: FileText },
    ],
  },
  {
    title: "تحلیل و کیفیت",
    items: [
      { key: "verification", label: "تأیید", icon: ShieldCheck },
      { key: "gates", label: "دروازه‌ها", icon: Gate },
      { key: "approvals", label: "تأییدها", icon: CheckSquare },
      { key: "trace", label: "تعقیب", icon: GitLink },
    ],
  },
  {
    title: "حاکمیت",
    items: [
      { key: "audit", label: "حسابرسی", icon: ScrollText },
      { key: "users", label: "کاربران", icon: Users },
    ],
  },
  {
    title: "سیستم",
    items: [
      { key: "settings", label: "تنظیمات", icon: Settings },
      { key: "logs", label: "لاگ‌ها", icon: Terminal },
    ],
  },
];

function YfgLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm", className)}>
      <Boxes className="h-5 w-5" />
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView } = useAppStore();
  return (
    <nav className="flex flex-col gap-3 px-3 pb-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </div>
          {group.items.map((item) => {
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
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
        </div>
      ))}
    </nav>
  );
}

function SidebarBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <YfgLogo />
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">YFG</div>
          <div className="text-[11px] text-muted-foreground">AI Software Factory</div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <ActiveWorkspaceBadge />
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

function ViewContent({ view }: { view: ViewKey }) {
  switch (view) {
    case "control": return <ControlView />;
    case "workspaces": return <WorkspacesView />;
    case "templates": return <TemplatesView />;
    case "tasks": return <TasksView />;
    case "guide": return <GuideView />;
    case "environments": return <EnvironmentsView />;
    case "analysis": return <AnalysisView />;
    case "architecture": return <ArchitectureView />;
    case "providers": return <ProvidersView />;
    case "users": return <UsersView />;
    case "artifacts": return <ArtifactsView />;
    case "verification": return <VerificationView />;
    case "gates": return <GatesView />;
    case "approvals": return <ApprovalsView />;
    case "trace": return <TraceView />;
    case "audit": return <AuditView />;
    case "settings": return <SettingsView />;
    case "logs": return <LogsView />;
    default: return <ControlView />;
  }
}

interface AppShellProps {
  onLogout: () => void;
}

export function AppShell({ onLogout }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const view = useAppStore((s) => s.view);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex items-center justify-between p-2">
              <span className="text-xs text-muted-foreground">منو</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <SidebarBody />
            </div>
          </SheetContent>
        </Sheet>

        <YfgLogo className="md:hidden" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">YFG AI Software Factory</span>
        </div>

        <div className="ms-auto flex items-center gap-1">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-l border-sidebar-border bg-sidebar md:block">
          <SidebarBody />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <ViewContent view={view} />
        </main>
      </div>

      <footer className="shrink-0 border-t border-border bg-background/80 px-4 py-2 text-[11px] text-muted-foreground backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>YFG · کارخانه نرم‌افزار هوش مصنوعی · 5-Phase Architecture</span>
          <span className="font-mono">v1.0 · 71 models · 27 agents · 50 hard gates</span>
        </div>
      </footer>
    </div>
  );
}
