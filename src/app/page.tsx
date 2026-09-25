"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LoginView } from "@/components/views/login-view";
import { getToken, clearToken, authHeaders } from "@/lib/auth/client";

const AppShell = dynamic(
  () => import("@/components/app-shell").then((m) => m.AppShell),
  { ssr: false, loading: () => <div className="flex min-h-screen items-center justify-center text-sm text-primary">در حال بارگذاری…</div> }
);

export default function Page() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);

  const checkAuth = React.useCallback(async () => {
    const token = getToken();
    if (!token) { setAuthed(false); return; }
    try {
      const res = await fetch("/api/auth/me", { headers: authHeaders() });
      setAuthed(res.ok);
    } catch { setAuthed(false); }
  }, []);

  React.useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleLogout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
    clearToken();
    setAuthed(false);
  }, []);

  if (authed === null) return <div className="flex min-h-screen items-center justify-center text-sm text-primary">در حال بررسی…</div>;
  if (!authed) return <LoginView onLogin={() => setAuthed(true)} />;
  return <AppShell onLogout={handleLogout} />;
}
