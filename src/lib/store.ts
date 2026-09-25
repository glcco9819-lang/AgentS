import { create } from "zustand";

export type ViewKey =
  | "control" | "workspaces" | "templates" | "tasks" | "guide"
  | "environments" | "analysis" | "architecture" | "providers" | "users"
  | "artifacts" | "verification" | "gates" | "approvals" | "trace"
  | "audit" | "settings" | "logs";

interface AppState {
  view: ViewKey;
  activeWorkspaceId: string | null;
  activeEnvironmentId: string | null;
  setView: (v: ViewKey) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveEnvironmentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "control",
  activeWorkspaceId: null,
  activeEnvironmentId: null,
  setView: (view) => set({ view }),
  setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
  setActiveEnvironmentId: (activeEnvironmentId) => set({ activeEnvironmentId }),
}));
