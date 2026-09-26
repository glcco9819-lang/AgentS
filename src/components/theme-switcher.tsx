"use client";

import * as React from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ThemeName = "corporate" | "emerald" | "sunset" | "dark-pro";

const THEMES: { name: ThemeName; label: string; color: string }[] = [
  { name: "corporate", label: "شرکتی", color: "#1a3a6b" },
  { name: "emerald", label: "زمردی", color: "#0b8a4f" },
  { name: "sunset", label: "غروب", color: "#d4541e" },
  { name: "dark-pro", label: "حرفه‌ای تاریک", color: "#d4a017" },
];

export function ThemeSwitcher() {
  const [theme, setThemeState] = React.useState<ThemeName>("corporate");
  const [dark, setDark] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("yfg-theme") as ThemeName | null;
    if (saved && THEMES.some((t) => t.name === saved)) {
      setThemeState(saved);
    }
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme");
    if (currentTheme) setThemeState(currentTheme as ThemeName);
    if (root.classList.contains("dark")) setDark(true);
    else setDark(false);
  }, []);

  const setTheme = (t: ThemeName) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t);
    localStorage.setItem("yfg-theme", t);
    if (t === "dark-pro") {
      root.classList.remove("dark");
      setDark(false);
    } else {
      root.classList.add("dark");
      setDark(true);
    }
    setThemeState(t);
  };

  const toggleDark = () => {
    const root = document.documentElement;
    if (dark) {
      root.classList.remove("dark");
      setDark(false);
    } else {
      root.classList.add("dark");
      setDark(true);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setOpen(!open)}>
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{THEMES.find((t) => t.name === theme)?.label}</span>
        </Button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setTheme(t.name); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  {t.label}
                  {theme === t.name && <Check className="ms-auto h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Button variant="ghost" size="icon" aria-label="روشن/تاریک" onClick={toggleDark}>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
