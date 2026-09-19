"use client";

import * as React from "react";
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  KeyRound,
  Cpu,
  Thermometer,
  Brain,
  Hash,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SettingsData {
  settings: Record<string, string> & { apiKeyMasked?: string; apiKeySet?: boolean };
  resolved: {
    provider: string;
    baseUrl: string;
    model: string;
    apiKey: string;
    temperature: number;
    thinking: string;
    maxContextMessages: number;
    usingSystemConfig: boolean;
  };
}

interface PromptRow {
  id: string;
  key: string;
  name: string;
  content: string;
  language: string;
}

export function SettingsView() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState("gateway");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [data, setData] = React.useState<SettingsData | null>(null);
  const [form, setForm] = React.useState({
    provider: "glm",
    baseUrl: "",
    model: "",
    apiKey: "",
    temperature: "0.6",
    thinking: "disabled",
    maxContextMessages: "20",
  });

  // Prompts
  const [prompts, setPrompts] = React.useState<PromptRow[]>([]);
  const [activePromptKey, setActivePromptKey] = React.useState("system");
  const [activePromptLang, setActivePromptLang] = React.useState("fa");
  const [promptDraft, setPromptDraft] = React.useState({ name: "", content: "" });
  const [promptSaving, setPromptSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/prompts?language=fa"),
      ]);
      const sData: SettingsData = await sRes.json();
      const pData = await pRes.json();
      setData(sData);
      setForm({
        provider: sData.settings.provider ?? "glm",
        baseUrl: sData.settings.baseUrl ?? "",
        model: sData.settings.model ?? "",
        apiKey: "",
        temperature: sData.settings.temperature ?? "0.6",
        thinking: sData.settings.thinking ?? "disabled",
        maxContextMessages: sData.settings.maxContextMessages ?? "20",
      });
      setPrompts(pData.prompts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Sync prompt editor when selection changes
  React.useEffect(() => {
    const p = prompts.find((x) => x.key === activePromptKey && x.language === activePromptLang);
    setPromptDraft({ name: p?.name ?? "", content: p?.content ?? "" });
  }, [activePromptKey, activePromptLang, prompts]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      if (!payload.apiKey) delete payload.apiKey;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("ذخیره ناموفق بود");
      toast({ title: "تنظیمات ذخیره شد", description: "AI Gateway به‌روزرسانی شد." });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const savePrompt = async () => {
    setPromptSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: activePromptKey,
          name: promptDraft.name,
          content: promptDraft.content,
          language: activePromptLang,
        }),
      });
      if (!res.ok) throw new Error("ذخیره ناموفق بود");
      toast({ title: "پرامپت ذخیره شد" });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPromptSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { resolved } = data;

  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <SettingsIcon className="h-5 w-5 text-primary" />
            تنظیمات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            پیکربندی AI Gateway و Prompt Manager. این پیکربندی data-driven است تا تعویض
            مدل/Provider بدون تغییر کد ممکن باشد.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="gateway" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              AI Gateway
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              پرامپت‌ها
            </TabsTrigger>
          </TabsList>

          {/* AI Gateway */}
          <TabsContent value="gateway" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    پیکربندی Provider
                  </span>
                  {resolved.usingSystemConfig ? (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      استفاده از کانفیگ سیستم
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px]">API Key سفارشی</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  مدل پیش‌فرض فعلی: <span className="font-mono" dir="ltr">{resolved.model}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={Cpu} label="Provider">
                    <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="glm">glm (Z.AI SDK)</SelectItem>
                        <SelectItem value="openai-compatible">openai-compatible</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field icon={Hash} label="نام مدل">
                    <Input
                      dir="ltr"
                      className="font-mono text-sm"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="GLM-4.7-Flash"
                    />
                  </Field>
                </div>

                <Field icon={KeyRound} label="Base URL">
                  <Input
                    dir="ltr"
                    className="font-mono text-sm"
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://api.z.ai/api/paas/v4"
                  />
                </Field>

                <Field icon={KeyRound} label="API Key">
                  <Input
                    dir="ltr"
                    className="font-mono text-sm"
                    type="password"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder={data.settings.apiKeySet ? data.settings.apiKeyMasked : "بدون کلید — از کانفیگ سیستم استفاده می‌شود"}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={Thermometer} label={`Temperature (${form.temperature})`}>
                    <Input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                      className="h-5"
                    />
                  </Field>
                  <Field icon={Hash} label="حداکثر پیام Context">
                    <Input
                      type="number"
                      min={4}
                      max={100}
                      value={form.maxContextMessages}
                      onChange={(e) => setForm({ ...form, maxContextMessages: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5">
                    <Brain className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Thinking (Chain of Thought)</div>
                      <div className="text-[11px] text-muted-foreground">
                        فعال کردن استدلال گام‌به‌گام مدل
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={form.thinking === "enabled"}
                    onCheckedChange={(c) => setForm({ ...form, thinking: c ? "enabled" : "disabled" })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={load}>انصراف</Button>
                  <Button onClick={save} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    ذخیره تنظیمات
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">اصل طراحی:</span> لایه‌ی Application
              هرگز مستقیماً به SDK یا مدل وابسته نیست؛ همیشه از طریق AI Gateway صحبت می‌کند.
              Providerها در آینده (GLM / Qwen / Llama / OpenAI / Azure) بدون تغییر در
              Project Intelligence قابل اضافه شدن هستند.
            </div>
          </TabsContent>

          {/* Prompts */}
          <TabsContent value="prompts" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  ویرایشگر پرامپت
                </CardTitle>
                <CardDescription>
                  پرامپت‌ها به‌جای hard-code در پایگاه‌داده ذخیره می‌شوند تا بدون تغییر کد قابل
                  ویرایش باشند.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>نوع پرامپت</Label>
                    <Select value={activePromptKey} onValueChange={setActivePromptKey}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">system — پایه</SelectItem>
                        <SelectItem value="codeReview">codeReview — بازبینی کد</SelectItem>
                        <SelectItem value="architecture">architecture — معماری</SelectItem>
                        <SelectItem value="sqlAnalysis">sqlAnalysis — تحلیل SQL</SelectItem>
                        <SelectItem value="documentation">documentation — مستندات</SelectItem>
                        <SelectItem value="bugAnalysis">bugAnalysis — تحلیل باگ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>زبان</Label>
                    <Select value={activePromptLang} onValueChange={setActivePromptLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">فارسی</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>نام</Label>
                  <Input
                    value={promptDraft.name}
                    onChange={(e) => setPromptDraft({ ...promptDraft, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>محتوا</Label>
                  <Textarea
                    dir="auto"
                    className="min-h-[220px] resize-y font-mono text-xs leading-6"
                    value={promptDraft.content}
                    onChange={(e) => setPromptDraft({ ...promptDraft, content: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={savePrompt} disabled={promptSaving} className="gap-2">
                    {promptSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    ذخیره پرامپت
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      {children}
    </div>
  );
}
