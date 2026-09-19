import { NextRequest } from "next/server";
import { getSettings, setSettings, SETTING_KEYS } from "@/lib/settings";
import { resolveConfig } from "@/lib/ai/gateway";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/settings — returns the effective (merged) AI gateway config */
export async function GET() {
  await ensureSeed();
  const stored = await getSettings();
  const resolved = await resolveConfig();
  // Don't echo the full apiKey back; mask it
  const apiKey = stored[SETTING_KEYS.apiKey] ?? "";
  return Response.json({
    settings: {
      ...stored,
      apiKey,
      apiKeyMasked: apiKey ? apiKey.slice(0, 4) + "••••" + apiKey.slice(-4) : "",
      apiKeySet: !!apiKey,
    },
    resolved,
  });
}

/** PUT /api/settings — update AI gateway config */
export async function PUT(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const updates: Record<string, string> = {};
  for (const k of Object.keys(SETTING_KEYS)) {
    const v = body[k];
    if (v === undefined || v === null) continue;
    if (k === SETTING_KEYS.apiKey && (v === "" || v === "••••")) continue; // don't blank the key on accidental save
    updates[k] = String(v);
  }
  await setSettings(updates);
  return Response.json({ ok: true, updated: Object.keys(updates) });
}
