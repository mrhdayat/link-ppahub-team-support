"use server";

import { isAdmin } from "@/lib/auth";
import { readDays, resetHits, type Day } from "@/lib/analytics";

// Same message the save action uses, so the client can recognise an expired session from any action.
const EXPIRED = "Sesi habis. Masuk lagi.";

export type StatsResult = { ok: true; days: Day[] } | { ok: false; error: string };

export async function getStats(): Promise<StatsResult> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  return { ok: true, days: await readDays() };
}

export async function resetStats(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  await resetHits();
  return { ok: true };
}
