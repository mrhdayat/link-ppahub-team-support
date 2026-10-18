import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, sql } from "./db";
import { clockIn, type Zona } from "./site";

// First-party, aggregate-only counters: one number per (day, key). No IPs, no cookies, no user agents stored.
// Keys: "view" (page opened), "wa" (STOP chat), "share", "qr", "l:<linkId>" (a sign/board was tapped).

export type Counts = Record<string, number>;
export type Day = { day: string; counts: Counts };

const FILE = path.join(process.cwd(), "data", "analytics.json");

export const EVENT_KEYS = ["view", "wa", "share", "qr"] as const;
export const isLinkKey = (k: string) => /^l:[\w-]{1,40}$/.test(k);

async function readFileStore(): Promise<Record<string, Counts>> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

// ponytail: file writes are serialised in-process only; fine for one dev/VPS process, use DATABASE_URL beyond that.
let queue: Promise<unknown> = Promise.resolve();

export async function recordHit(k: string, zona: Zona, now = new Date()): Promise<void> {
  const day = clockIn(zona, now).date;
  if (sql) {
    await ensureSchema();
    await sql`insert into hits (day, k, n) values (${day}, ${k}, 1) on conflict (day, k) do update set n = hits.n + 1`;
    return;
  }
  queue = queue.then(async () => {
    const store = await readFileStore();
    const d = (store[day] ??= {});
    d[k] = (d[k] ?? 0) + 1;
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(store));
  });
  await queue;
}

/** Every stored day, oldest first. */
export async function readDays(): Promise<Day[]> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`select to_char(day, 'YYYY-MM-DD') as day, k, n from hits order by day`) as { day: string; k: string; n: number }[];
    const by = new Map<string, Counts>();
    for (const r of rows) (by.get(r.day) ?? by.set(r.day, {}).get(r.day)!)[r.k] = Number(r.n);
    return [...by].map(([day, counts]) => ({ day, counts }));
  }
  const store = await readFileStore();
  return Object.keys(store)
    .sort()
    .map((day) => ({ day, counts: store[day] }));
}

/** All-time totals per key. */
export function totals(days: Day[]): Counts {
  const t: Counts = {};
  for (const d of days) for (const [k, n] of Object.entries(d.counts)) t[k] = (t[k] ?? 0) + n;
  return t;
}

/** The last `n` calendar days ending today (owner's zone), zero-filled so charts have no gaps. */
export function lastDays(days: Day[], n: number, zona: Zona, now = new Date()): Day[] {
  const byDay = new Map(days.map((d) => [d.day, d.counts]));
  const today = clockIn(zona, now).date;
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1, d - (n - 1 - i)));
    const day = t.toISOString().slice(0, 10);
    return { day, counts: byDay.get(day) ?? {} };
  });
}

/** Sum of all link taps in one day's counts. */
export const linkTaps = (c: Counts) => Object.entries(c).reduce((s, [k, n]) => (isLinkKey(k) ? s + n : s), 0);

/** Wipe every counter (admin "reset statistik"). */
export async function resetHits(): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`delete from hits`;
    return;
  }
  queue = queue.then(() => writeFile(FILE, "{}").catch(() => {}));
  await queue;
}
