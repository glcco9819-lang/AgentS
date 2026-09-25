"use client";

import * as React from "react";
import { FolderOpen, ChevronDown, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  language?: string | null;
  framework?: string | null;
  status: string;
}

export function ActiveWorkspaceBadge() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useAppStore((s) => s.setActiveWorkspaceId);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ workspaces: Workspace[] }>("/api/workspaces");
      setWorkspaces(data.workspaces ?? []);
      if (!activeWorkspaceId && data.workspaces?.length > 0) {
        setActiveWorkspaceId(data.workspaces[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{active?.name ?? "بدون فضای کار"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">فضاهای کار</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <DropdownMenuItem disabled className="text-xs">
            در حال بارگذاری…
          </DropdownMenuItem>
        )}
        {!loading && workspaces.length === 0 && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            فضای کاری یافت نشد
          </DropdownMenuItem>
        )}
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => setActiveWorkspaceId(w.id)}
            className="gap-2 text-xs"
          >
            <div className="flex flex-1 flex-col">
              <span className="truncate">{w.name}</span>
              {(w.language || w.framework) && (
                <span className="text-[10px] text-muted-foreground">
                  {w.language}
                  {w.language && w.framework ? " · " : ""}
                  {w.framework}
                </span>
              )}
            </div>
            {activeWorkspaceId === w.id && <Check className="h-3 w-3 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
