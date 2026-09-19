import { ensureSeed } from "@/lib/init";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/seed — explicitly seed defaults */
export async function POST() {
  await ensureSeed();
  await log("info", "system", "Seed triggered via API");
  return Response.json({ ok: true });
}
