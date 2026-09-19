import { create } from "zustand";

export type ViewKey =
  | "chat"
  | "projects"
  | "analysis"
  | "architecture"
  | "settings"
  | "logs";

interface AppState {
  view: ViewKey;
  activeSessionId: string | null;
  activeProjectId: string | null;
  setView: (v: ViewKey) => void;
  setActiveSessionId: (id: string | null) => void;
  setActiveProjectId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "chat",
  activeSessionId: null,
  activeProjectId: null,
  setView: (view) => set({ view }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
}));
