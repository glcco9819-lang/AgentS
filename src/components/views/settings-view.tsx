"use client";
import * as React from "react";
import { Settings as SettingsIcon, Save, Loader2, Cpu, KeyRound, Thermometer, Brain, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/theme-switcher";
export function SettingsView() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ provider: "glm", baseUrl: "", model: "", apiKey: "", temperature: "0.6", thinking: "disabled", maxContextMessages: "20" });
  const load = React.useCallback(async () => { setLoading(true); try { const res = await fetch("/api/settings"); const data = await res.json(); const s = data.settings ?? {}; setForm({ provider: s.provider ?? "glm", baseUrl: s.baseUrl ?? "", model: s.model ?? "", apiKey: "", temperature: s.temperature ?? "0.6", thinking: s.thinking ?? "disabled", maxContextMessages: s.maxContextMessages ?? "20" }); } finally { setLoading(false); } }, []);
  React.useEffect(() => { load(); }, [load]);
  const save = async () => { setSaving(true); try { const p: Record<string,string> = { ...form }; if (!p.apiKey) delete p.apiKey; await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); toast({ title: "تنظیمات ذخیره شد" }); load(); } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); } finally { setSaving(false); } };
  if (loading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (<div className="flex-1 overflow-y-auto scroll-thin"><div className="mx-auto w-full max-w-3xl px-4 py-6"><h1 className="flex items-center gap-2 text-xl font-bold mb-6"><SettingsIcon className="h-5 w-5 text-primary" /> تنظیمات</h1>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Cpu className="h-4 w-4 text-primary" /> AI Gateway</CardTitle><CardDescription>تعویض مدل بدون تغییر کد.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><Cpu className="h-3.5 w-3.5" />Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div><div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><Hash className="h-3.5 w-3.5" />مدل</Label><Input dir="ltr" className="font-mono text-sm" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="GLM-4.7-Flash" /></div></div>
        <div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><KeyRound className="h-3.5 w-3.5" />Base URL</Label><Input dir="ltr" className="font-mono text-sm" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><KeyRound className="h-3.5 w-3.5" />API Key</Label><Input dir="ltr" className="font-mono text-sm" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="از کانفیگ سیستم" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><Thermometer className="h-3.5 w-3.5" />Temperature ({form.temperature})</Label><Input type="range" min={0} max={1} step={0.05} value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className="h-5" /></div><div className="space-y-1.5"><Label className="flex items-center gap-1 text-xs text-muted-foreground"><Hash className="h-3.5 w-3.5" />Max Context</Label><Input type="number" min={4} max={100} value={form.maxContextMessages} onChange={(e) => setForm({ ...form, maxContextMessages: e.target.value })} /></div></div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"><div className="flex items-center gap-2.5"><Brain className="h-4 w-4 text-primary" /><div><div className="text-sm font-medium">Thinking</div><div className="text-[11px] text-muted-foreground">Chain of Thought</div></div></div><Switch checked={form.thinking === "enabled"} onCheckedChange={(c) => setForm({ ...form, thinking: c ? "enabled" : "disabled" })} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={load}>انصراف</Button><Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}ذخیره</Button></div>
      </CardContent></Card>
    <Card className="mt-4"><CardContent className="p-5"><ThemeSwitcher /></CardContent></Card>
  </div></div>);
}
