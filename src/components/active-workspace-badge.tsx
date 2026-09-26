"use client";

import * as React from "react";
import { FolderOpen, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  status: string;
}

export function ActiveWorkspaceBadge() {
  const { activeWorkspaceId, setActiveWorkspaceId, setView } = useAppStore();
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [current, setCurrent] = React.useState<Workspace | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await api<{ workspaces: Workspace[] }>("/api/workspaces");
      setWorkspaces(data.workspaces ?? []);
      if (activeWorkspaceId) {
        setCurrent(data.workspaces?.find((w) => w.id === activeWorkspaceId) ?? null);
      }
    } catch {
      // not authed yet or error
    }
  }, [activeWorkspaceId]);

  React.useEffect(() => { load(); }, [load]);

  const select = (ws: Workspace) => {
    setActiveWorkspaceId(ws.id);
    setCurrent(ws);
    setOpen(false);
  };

  if (!activeWorkspaceId) {
    return (
      <button
        onClick={() => setView("workspaces")}
        className="flex items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <FolderOpen className="h-3 w-3" />
        انتخاب ورک‌اسپیس
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card px-2.5 py-1.5 text-[11px]"
      >
        <FolderOpen className="h-3 w-3 text-primary" />
        <span className="truncate max-w-[100px]">{current?.name ?? "..."}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-popover p-1 shadow-lg">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => select(ws)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent",
                  ws.id === activeWorkspaceId && "bg-accent"
                )}
              >
                <FolderOpen className="h-3 w-3 text-primary" />
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && <span className="ms-auto text-primary">✓</span>}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => { setActiveWorkspaceId(null); setCurrent(null); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <X className="h-3 w-3" />
              حذف انتخاب
            </button>
          </div>
        </>
      )}
    </div>
  );
}
