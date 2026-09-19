import { NextRequest } from "next/server";
import { listPrompts, upsertPrompt, type PromptKey } from "@/lib/ai/prompts";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/prompts?language=fa|en */
export async function GET(req: NextRequest) {
  await ensureSeed();
  const language = req.nextUrl.searchParams.get("language") as "fa" | "en" | null;
  const prompts = await listPrompts(language ?? undefined);
  return Response.json({ prompts });
}

/** PUT /api/prompts — update a single prompt */
export async function PUT(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const { key, name, content, language, isDefault } = body as {
    key: PromptKey;
    name: string;
    content: string;
    language: "fa" | "en";
    isDefault?: boolean;
  };
  if (!key || !name || !content || !language) {
    return Response.json({ error: "key, name, content, language required" }, { status: 400 });
  }
  const prompt = await upsertPrompt({ key, name, content, language, isDefault });
  return Response.json({ prompt });
}
