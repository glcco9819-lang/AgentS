import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { listTemplates, CATEGORY_LABELS } from "@/lib/core/task-templates";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const templates = await listTemplates(category);
  return NextResponse.json({ templates, categories: CATEGORY_LABELS });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.category || !body.instruction) {
    return NextResponse.json({ error: "name, category, instruction required" }, { status: 400 });
  }
  const t = await db.taskTemplate.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description ?? "",
      instruction: body.instruction,
      agentType: body.agentType ?? "backend-engineer",
      taskType: body.taskType ?? "implementation",
      verificationType: body.verificationType ?? "code-review",
      approvalGate: body.approvalGate ?? null,
      expectedOutput: body.expectedOutput ?? null,
      icon: body.icon ?? null,
      isCustom: true,
    },
  });
  return NextResponse.json({ template: t });
}
