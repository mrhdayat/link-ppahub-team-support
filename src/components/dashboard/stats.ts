import type { Counts, Day, HourRow } from "@/lib/analytics";
import { isBaru, lanesOf, type Link, type Site } from "@/lib/site";

// Client-side maths over the raw day counters. lib/analytics.ts pulls in node:fs and the Neon driver,
// so the two tiny helpers it shares with this file (zero-fill, link-key test) are repeated here.

export const isLinkKey = (k: string) => k.startsWith("l:");
export const linkTaps = (c: Counts) => Object.entries(c).reduce((s, [k, n]) => (isLinkKey(k) ? s + n : s), 0);

/** "2026-10-15" shifted by `k` calendar days. */
export function addDays(day: string, k: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + k)).toISOString().slice(0, 10);
}

/** `n` zero-filled days ending `end` (inclusive), oldest first. */
export function span(days: Day[], end: string, n: number): Day[] {
  const by = new Map(days.map((d) => [d.day, d.counts]));
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(end, i - (n - 1));
    return { day, counts: by.get(day) ?? {} };
  });
}

export function sum(days: Day[]): Counts {
  const t: Counts = {};
  for (const d of days) for (const [k, n] of Object.entries(d.counts)) t[k] = (t[k] ?? 0) + n;
  return t;
}

/** Days grouped into buckets of `size`, newest bucket ending on the last day (the oldest may be shorter). */
export function bucket(days: Day[], size: number): { from: string; to: string; counts: Counts }[] {
  const out: { from: string; to: string; counts: Counts }[] = [];
  for (let end = days.length; end > 0; end -= size) {
    const part = days.slice(Math.max(0, end - size), end);
    out.unshift({ from: part[0]!.day, to: part[part.length - 1]!.day, counts: sum(part) });
  }
  return out;
}

const num = new Intl.NumberFormat("id-ID");
const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
export const fmt = (n: number) => num.format(n);
export const fmtCompact = (n: number) => (n < 10000 ? num.format(n) : compact.format(n));
export const pct = (n: number) =>
  n >= 10000 ? `${compact.format(n)}%` : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n)}%`;

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export function dayLabel(day: string, withWeekday = false): string {
  const [y, m, d] = day.split("-").map(Number);
  const wd = HARI[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()];
  return `${withWeekday ? `${wd}, ` : ""}${d} ${BULAN[m! - 1]}`;
}
export function rangeLabel(from: string, to: string): string {
  if (from === to) return dayLabel(from, true);
  const [, m1, d1] = from.split("-").map(Number);
  const [, m2] = to.split("-").map(Number);
  return m1 === m2 ? `${d1}–${dayLabel(to)}` : `${dayLabel(from)} – ${dayLabel(to)}`;
}

/** Axis ticks from 0 in steps of 1/2/5 × 10^k, at most ~4 intervals, covering `max`. */
export function ticks(max: number): number[] {
  if (max <= 4) return [0, 1, 2, 3, 4]; // counts are whole numbers; never a 0–1 axis
  const raw = Math.max(1, max) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw && s >= 1) ?? 1;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/* ---------- Hours (#29) ---------- */

export const HARI_PANJANG = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
/** Weekday of "2026-10-22", Monday = 0. */
export const weekdayOf = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;

/** 7 rows (Sen–Min) × 24 hours of `k`, summed over days from..to inclusive. */
export function hourGrid(hours: HourRow[], from: string, to: string, k: HourRow["k"]): number[][] {
  const g = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const r of hours) if (r.k === k && r.day >= from && r.day <= to) g[weekdayOf(r.day)]![r.hour]! += r.n;
  return g;
}

export type Busy = { day: number; hour: number; n: number };
/** The fullest cell; ties go to the earliest in the week. Null when every cell is 0. */
export function busiest(g: number[][]): Busy | null {
  let best: Busy | null = null;
  g.forEach((row, day) => row.forEach((n, hour) => { if (n > (best?.n ?? 0)) best = { day, hour, n }; }));
  return best;
}
const hh = (h: number) => String(h).padStart(2, "0");
export const hourLabel = (h: number) => `${hh(h)}.00–${hh(h + 1)}.00`;
export const busyLabel = (b: Busy) => `${HARI_PANJANG[b.day]} ${hourLabel(b.hour)}`;

/* ---------- Per category ---------- */

/** Clicks per lane. A link in several lanes counts in each of them, so the rows can add up past the total. */
export function perKategori(site: Site, c: Counts) {
  return site.kategori
    .map((k) => {
      const ls = site.link.filter((l) => lanesOf(l).includes(k.id));
      return { k, links: ls.length, klik: ls.reduce((s, l) => s + (c[`l:${l.id}`] ?? 0), 0) };
    })
    .sort((a, b) => b.klik - a.klik);
}

/* ---------- Weekly report (#36) ---------- */

export type Weekly = {
  from: string; to: string; pFrom: string; pTo: string;
  views: number; pViews: number; clicks: number; pClicks: number; ratio: number | null; pRatio: number | null;
  top: { link: Link; n: number }[];
  baru: Link[];
  tanpaKlik: Link[];
  jam: Busy | null;
};

/** The last 7 days (ending today) against the 7 before. */
export function weekly(site: Site, days: Day[], hours: HourRow[], today: string): Weekly {
  const from = addDays(today, -6);
  const c = sum(span(days, today, 7));
  const p = sum(span(days, addDays(today, -7), 7));
  const views = c.view ?? 0, pViews = p.view ?? 0, clicks = linkTaps(c), pClicks = linkTaps(p);
  const n = (l: Link) => c[`l:${l.id}`] ?? 0;
  return {
    from, to: today, pFrom: addDays(today, -13), pTo: addDays(today, -7),
    views, pViews, clicks, pClicks,
    ratio: views ? clicks / views : null,
    pRatio: pViews ? pClicks / pViews : null,
    top: site.link
      .map((link) => ({ link, n: n(link) }))
      .filter((r) => r.n > 0)
      .sort((a, b) => b.n - a.n) // stable: ties keep CONFIG order
      .slice(0, 5),
    baru: site.link.filter((l) => isBaru(l, today)),
    tanpaKlik: site.link.filter((l) => n(l) === 0),
    jam: busiest(hourGrid(hours, from, today, "tap")),
  };
}

const perVisit = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const fmtRatio = (r: number | null) => (r === null ? "–" : `${perVisit.format(r)}×`);

/** "+12%", "−5%", "tetap", "+3 dari 0"; ratios move in ×. */
export function change(cur: number | null, prev: number | null, ratio = false): string {
  if (cur === null || prev === null) return "belum bisa dibandingkan";
  const d = cur - prev;
  if (!d || (ratio && perVisit.format(Math.abs(d)) === "0")) return "tetap";
  const sign = d > 0 ? "+" : "−";
  if (ratio) return `${sign}${perVisit.format(Math.abs(d))}×`;
  if (!prev) return `+${fmt(d)} dari 0`;
  return `${sign}${pct(Math.abs(d / prev) * 100)}`;
}

/** Plain text for WhatsApp: *bold* is WhatsApp's own markup and reads fine anywhere else. */
export function weeklyText(w: Weekly, nama: string): string {
  const lines = [
    `*Laporan mingguan ${nama}*`,
    `${rangeLabel(w.from, w.to)} (dibanding ${rangeLabel(w.pFrom, w.pTo)})`,
    "",
    `Kunjungan: ${fmt(w.views)} (${change(w.views, w.pViews)})`,
    `Klik: ${fmt(w.clicks)} (${change(w.clicks, w.pClicks)})`,
    `Klik per kunjungan: ${fmtRatio(w.ratio)} (${change(w.ratio, w.pRatio, true)})`,
    "",
    "*Tautan teratas*",
    ...(w.top.length ? w.top.map((r, i) => `${i + 1}. ${r.link.judul}: ${fmt(r.n)} klik`) : ["Belum ada klik."]),
    "",
    `Tautan baru: ${w.baru.length ? w.baru.map((l) => l.judul).join(", ") : "tidak ada"}`,
    `Tautan tanpa klik: ${fmt(w.tanpaKlik.length)}`,
    `Jam tersibuk: ${w.jam ? busyLabel(w.jam) : "belum ada data"}`,
  ];
  return lines.join("\n");
}

/* ---------- Version history (#30) ---------- */

/** What restoring `old` would change about `cur`, in a few short phrases. */
export function diffSummary(old: Site, cur: Site): string[] {
  const out: string[] = [];
  const curL = new Map(cur.link.map((l) => [l.id, l]));
  const oldL = new Map(old.link.map((l) => [l.id, l]));
  const back = old.link.filter((l) => !curL.has(l.id)).length;
  const gone = cur.link.filter((l) => !oldL.has(l.id)).length;
  const edited = old.link.filter((l) => curL.has(l.id) && JSON.stringify(l) !== JSON.stringify(curL.get(l.id))).length;
  if (back) out.push(`+${back} tautan`);
  if (gone) out.push(`−${gone} tautan`);
  if (edited) out.push(`${edited} tautan berubah`);
  const curK = new Map(cur.kategori.map((k) => [k.id, k]));
  for (const k of old.kategori) {
    const now = curK.get(k.id);
    if (now && now.nama !== k.nama) out.push(`kategori “${now.nama}” → “${k.nama}”`);
  }
  const kBack = old.kategori.filter((k) => !curK.has(k.id)).length;
  const kGone = cur.kategori.filter((k) => !old.kategori.some((o) => o.id === k.id)).length;
  if (kBack) out.push(`+${kBack} kategori`);
  if (kGone) out.push(`−${kGone} kategori`);
  const same = (key: keyof Site) => JSON.stringify(old[key]) === JSON.stringify(cur[key]);
  if (!same("profil")) out.push("profil berubah");
  if (!same("status")) out.push("status berubah");
  const rest = (Object.keys(cur) as (keyof Site)[]).filter((k) => !["link", "kategori", "profil", "status"].includes(k));
  if (rest.some((k) => !same(k))) out.push("pengaturan lain berubah");
  return out;
}

const RT = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
/** "5 menit yang lalu", "kemarin". */
export function ago(iso: string, now: number): string {
  const s = Math.round((Date.parse(iso) - now) / 1000);
  if (s > -60) return "baru saja";
  if (s > -3600) return RT.format(Math.round(s / 60), "minute");
  if (s > -86_400) return RT.format(Math.round(s / 3600), "hour");
  return RT.format(Math.round(s / 86_400), "day");
}
