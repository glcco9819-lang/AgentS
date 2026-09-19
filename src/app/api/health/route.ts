import { ping } from "@/lib/ai/gateway";
import { ensureSeed } from "@/lib/init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — ping the AI gateway to verify connectivity */
export async function GET() {
  await ensureSeed();
  const result = await ping();
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
