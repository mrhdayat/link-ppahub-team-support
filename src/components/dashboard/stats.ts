import type { Counts, Day } from "@/lib/analytics";

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
