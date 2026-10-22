"use server";

import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { readDays, readHours, resetHits, type Day, type HourRow } from "@/lib/analytics";
import { readCurrent, readHistory, readVersion, saveSite } from "@/lib/store";
import { siteSchema, type Site } from "@/lib/site";
import { diffSummary } from "@/components/dashboard/stats";

// Same message the save action uses, so the client can recognise an expired session from any action.
const EXPIRED = "Sesi habis. Masuk lagi.";

export type StatsResult = { ok: true; days: Day[]; hours: HourRow[] } | { ok: false; error: string };

export async function getStats(): Promise<StatsResult> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  const [days, hours] = await Promise.all([readDays(), readHours()]);
  return { ok: true, days, hours };
}

export async function resetStats(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  await resetHits();
  return { ok: true };
}

/** One kept version, summarised. `changes` = what restoring it would do; null when it no longer fits the schema. */
export type VersionInfo = {
  id: number; savedAt: string; note: string | null; links: number; kategori: number; changes: string[] | null;
};

export async function listHistory(): Promise<{ ok: true; versions: VersionInfo[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  const [list, cur] = await Promise.all([readHistory(), readCurrent()]);
  return {
    ok: true,
    versions: list.map((v) => {
      const p = siteSchema.safeParse(v.value);
      return {
        id: v.id, savedAt: v.savedAt, note: v.note,
        links: p.success ? p.data.link.length : 0,
        kategori: p.success ? p.data.kategori.length : 0,
        changes: p.success ? diffSummary(p.data, cur) : null,
      };
    }),
  };
}

/** Makes a kept version current. Saving it keeps the version it replaces, so a restore can itself be undone. */
export async function restoreVersion(id: number): Promise<{ ok: true; site: Site } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  if (!Number.isSafeInteger(id)) return { ok: false, error: "Versi tidak dikenal." };
  const raw = await readVersion(id);
  if (!raw) return { ok: false, error: "Versi ini sudah tidak tersimpan." };
  const p = siteSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Versi ini tidak cocok dengan format sekarang." };
  await saveSite(p.data, `sebelum memulihkan versi #${id}`);
  updateTag("site");
  return { ok: true, site: p.data };
}

export type Wilayah = { code: string; name: string };

/**
 * One level of Indonesia's region tree from wilayah.id (no key; it has no CORS, so the admin asks through here):
 * "" → provinsi, "63" → kab/kota, "63.10" → kecamatan, "63.10.12" → desa. The code is checked before it reaches the URL.
 */
export async function wilayah(parent: string): Promise<{ ok: true; items: Wilayah[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  if (typeof parent !== "string" || !/^(\d{2}(\.\d{2}){0,2})?$/.test(parent)) return { ok: false, error: "Kode wilayah tidak dikenal." };
  const kind = parent === "" ? "provinces" : ["regencies", "districts", "villages"][parent.split(".").length - 1];
  try {
    const r = await fetch(`https://wilayah.id/api/${kind}${parent ? `/${parent}` : ""}.json`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { ok: false, error: `Daftar wilayah tidak bisa dimuat (${r.status}).` };
    const j = (await r.json()) as { data?: unknown } | unknown[];
    const rows = (Array.isArray(j) ? j : (j as { data?: unknown }).data) as unknown;
    if (!Array.isArray(rows)) return { ok: false, error: "Format daftar wilayah berubah." };
    const items = rows
      .filter((x): x is Wilayah => typeof x?.code === "string" && typeof x?.name === "string")
      .map((x) => ({ code: x.code, name: x.name }));
    return { ok: true, items };
  } catch {
    return { ok: false, error: "Daftar wilayah tidak bisa dimuat. Periksa koneksi lalu coba lagi." };
  }
}
