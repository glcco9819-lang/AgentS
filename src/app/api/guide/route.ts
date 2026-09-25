import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { GUIDE_SECTIONS } from "@/lib/guide-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  return NextResponse.json({ sections: GUIDE_SECTIONS });
}
