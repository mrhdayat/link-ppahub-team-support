import type { Anggota, Kategori, Site } from "@/lib/site";

// Pure helpers for the team page (/tim) and its admin tab. No React, so the checks can import them.

/** One group on the team page: a lane, or the whole team (id ""). */
export type Kelompok = { id: string; k?: Kategori; anggota: Anggota[] };

/**
 * Members grouped by lane: "Seluruh tim" first (jalur "" or a lane that no longer exists),
 * then lanes in category order. Empty groups are left out; members keep their CONFIG order.
 */
export function kelompokTim(site: Pick<Site, "kategori" | "tim">): Kelompok[] {
  const ids = new Set(site.kategori.map((k) => k.id));
  const umum = site.tim.filter((a) => !ids.has(a.jalur));
  return [
    ...(umum.length ? [{ id: "", anggota: umum }] : []),
    ...site.kategori.map((k) => ({ id: k.id, k, anggota: site.tim.filter((a) => a.jalur === k.id) })).filter((g) => g.anggota.length),
  ];
}

/** Two-letter initials for the sign: first letters of the first two words, or the first two letters of one word. */
export function inisial(nama: string): string {
  const words = nama.trim().split(/\s+/).filter(Boolean);
  const chars = words.length > 1 ? words.slice(0, 2).map((w) => Array.from(w)[0]) : Array.from(words[0] ?? "").slice(0, 2);
  return chars.join("").toUpperCase();
}

/**
 * An Indonesian phone number as international digits: "0812-3456-789", "+62 812…", "62812…",
 * "https://wa.me/62812…" and "tel:+62812…" all give "62812…". Null when it isn't one.
 */
export function nomorID(input: string): string | null {
  let d = input.trim().replace(/^https:\/\/wa\.me\//i, "").replace(/^tel:/i, "").replace(/[\s().-]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  return /^62\d{7,13}$/.test(d) ? d : null;
}

/** Typed WhatsApp number → stored "https://wa.me/62…"; "" stays ""; null = not a number. */
export const keWa = (s: string) => (s.trim() ? (nomorID(s) && `https://wa.me/${nomorID(s)}`) : "");
/** Typed phone number → stored "tel:+62…"; "" stays ""; null = not a number. */
export const keTelp = (s: string) => (s.trim() ? (nomorID(s) && `tel:+${nomorID(s)}`) : "");
/** Stored wa/telp → what the admin types: "+62812…". */
export const tampilNomor = (s: string) => (s ? `+${nomorID(s) ?? s}` : "");
