import { ensureDefaultSettings } from "@/lib/settings";
import { ensureDefaultPrompts } from "@/lib/ai/prompts";
import { log } from "@/lib/logger";

let seedPromise: Promise<void> | null = null;

/**
 * App initialization — idempotent. Ensures default AI settings and prompts
 * exist in the database. Safe to call on every request; cheap after first run.
 */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        await ensureDefaultSettings();
        await ensureDefaultPrompts();
      } catch (e) {
        seedPromise = null; // allow retry
        await log("error", "system", "Seed failed", { message: (e as Error).message });
        throw e;
      }
    })();
  }
  return seedPromise;
}
