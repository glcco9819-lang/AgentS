"use client";

import * as React from "react";
import { Users as UsersIcon, Plus, RefreshCw, KeyRound, Shield } from "lucide-react";
import { api } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  isActive: boolean;
  roles: string[];
  lastLoginAt?: string | null;
}

export function UsersView() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<User | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [form, setForm] = React.useState({ username: "", password: "", fullName: "", email: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ users: User[] }>("/api/users");
      setUsers(data.users ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const register = async () => {
    if (!form.username || !form.password) {
      toast.error("نام کاربری و رمز عبور الزامی است");
      return;
    }
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("کاربر ایجاد شد");
      setOpen(false);
      setForm({ username: "", password: "", fullName: "", email: "" });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await api(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      toast.success(u.isActive ? "غیرفعال شد" : "فعال شد");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const changeRole = async (u: User, role: string) => {
    const newRoles = u.roles.includes(role)
      ? u.roles.filter((r) => r !== role)
      : [...u.roles, role];
    try {
      await api(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roles: newRoles }),
      });
      toast.success("نقش‌ها به‌روزرسانی شد");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget || !newPassword) return;
    try {
      await api(`/api/users/${resetTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
      toast.success("رمز عبور تغییر کرد");
      setResetTarget(null);
      setNewPassword("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">کاربران</h1>
            <p className="text-sm text-muted-foreground">مدیریت کاربران و نقش‌ها</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
              به‌روزرسانی
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  کاربر جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ثبت کاربر جدید</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-1.5">
                    <Label>نام کاربری</Label>
                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>رمز عبور</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نام کامل</Label>
                    <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ایمیل</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>لغو</Button>
                  <Button onClick={register}>ثبت</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UsersIcon className="h-4 w-4" />
              فهرست کاربران
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 animate-pulse rounded bg-muted/50" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">نام کاربری</TableHead>
                    <TableHead className="text-xs">نام کامل</TableHead>
                    <TableHead className="text-xs">نقش‌ها</TableHead>
                    <TableHead className="text-xs">وضعیت</TableHead>
                    <TableHead className="text-xs">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs font-medium">
                        {u.username}
                        {u.email && <div className="text-[10px] text-muted-foreground" dir="ltr">{u.email}</div>}
                      </TableCell>
                      <TableCell className="text-xs">{u.fullName ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {["admin", "manager", "engineer", "viewer"].map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(u, r)}
                              className={`rounded px-1.5 py-0.5 text-[10px] ${u.roles.includes(r) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "secondary"} className="text-[10px]">
                          {u.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[10px]"
                            onClick={() => toggleActive(u)}
                          >
                            <Shield className="h-3 w-3" />
                            {u.isActive ? "غیرفعال" : "فعال"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[10px]"
                            onClick={() => setResetTarget(u)}
                          >
                            <KeyRound className="h-3 w-3" />
                            رمز
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور — {resetTarget?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>رمز جدید</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>لغو</Button>
            <Button onClick={resetPassword}>تغییر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
