"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useAppStore, type ThemeName } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES: { name: ThemeName; label: string }[] = [
  { name: "corporate", label: "شرکتی" },
  { name: "emerald", label: "زمردی" },
  { name: "sunset", label: "غروب" },
  { name: "dark-pro", label: "حرفه‌ای تاریک" },
];

export function ThemeSwitcher() {
  const theme = useAppStore((s) => s.theme);
  const dark = useAppStore((s) => s.dark);
  const setTheme = useAppStore((s) => s.setTheme);
  const setDark = useAppStore((s) => s.setDark);

  // Apply theme to <html>
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, dark]);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", `theme-dot-${theme}`)} />
            <span className="hidden sm:inline">{THEMES.find((t) => t.name === theme)?.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {THEMES.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={() => setTheme(t.name)}
              className="gap-2 text-xs"
            >
              <span className={cn("h-2 w-2 rounded-full", `theme-dot-${t.name}`)} />
              {t.label}
              {theme === t.name && <span className="ms-auto text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        aria-label="تغییر حالت روشن/تاریک"
        onClick={() => setDark(!dark)}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
