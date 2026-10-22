import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, sql } from "./db";
import { clockIn, type Zona } from "./site";

// First-party, aggregate-only counters: one number per (day, key). No IPs, no cookies, no user agents stored.
// Keys: "view" (page opened), "wa" (STOP chat), "share", "qr", "l:<linkId>" (a sign/board was tapped).

export type Counts = Record<string, number>;
export type Day = { day: string; counts: Counts };
/** One hour on the owner's clock. k: "view" or "tap" (any link). */
export type HourRow = { day: string; hour: number; k: "view" | "tap"; n: number };

const FILE = path.join(process.cwd(), "data", "analytics.json");
// { "2026-10-22": { "7:view": 3, "7:tap": 5 } }
const HOUR = "analytics-hour.json";
const HOUR_FILE = path.join(process.cwd(), "data", HOUR);

export const EVENT_KEYS = ["view", "wa", "share", "qr"] as const;
export const isLinkKey = (k: string) => /^l:[\w-]{1,40}$/.test(k);

async function readFileStore(name = "analytics.json"): Promise<Record<string, Counts>> {
  try {
    // Joined here, not passed in, so the bundler can see the read stays inside data/.
    return JSON.parse(await readFile(path.join(process.cwd(), "data", name), "utf8"));
  } catch {
    return {};
  }
}

const hourKind = (k: string): HourRow["k"] | null => (k === "view" ? "view" : isLinkKey(k) ? "tap" : null);

// ponytail: file writes are serialised in-process only; fine for one dev/VPS process, use DATABASE_URL beyond that.
let queue: Promise<unknown> = Promise.resolve();

export async function recordHit(k: string, zona: Zona, now = new Date()): Promise<void> {
  const { date: day, hour } = clockIn(zona, now);
  const hk = hourKind(k);
  if (sql) {
    await ensureSchema();
    const day1 = sql`insert into hits (day, k, n) values (${day}, ${k}, 1) on conflict (day, k) do update set n = hits.n + 1`;
    await (hk
      ? sql.transaction([
          day1,
          sql`insert into hits_hour (day, hour, k, n) values (${day}, ${hour}, ${hk}, 1)
            on conflict (day, hour, k) do update set n = hits_hour.n + 1`,
        ])
      : day1);
    return;
  }
  queue = queue.then(async () => {
    const store = await readFileStore();
    const d = (store[day] ??= {});
    d[k] = (d[k] ?? 0) + 1;
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(store));
    if (!hk) return;
    const hours = await readFileStore(HOUR);
    const h = (hours[day] ??= {});
    h[`${hour}:${hk}`] = (h[`${hour}:${hk}`] ?? 0) + 1;
    await writeFile(HOUR_FILE, JSON.stringify(hours));
  });
  await queue;
}

/** Every stored hour, oldest day first. Empty until the first hit after this table shipped. */
export async function readHours(): Promise<HourRow[]> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`select to_char(day, 'YYYY-MM-DD') as day, hour, k, n from hits_hour order by day, hour`) as HourRow[];
    return rows.map((r) => ({ day: r.day, hour: Number(r.hour), k: r.k, n: Number(r.n) }));
  }
  const store = await readFileStore(HOUR);
  return Object.keys(store)
    .sort()
    .flatMap((day) =>
      Object.entries(store[day]!).map(([key, n]) => {
        const [hour, k] = key.split(":");
        return { day, hour: Number(hour), k: k as HourRow["k"], n };
      }),
    );
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
    await sql.transaction([sql`delete from hits`, sql`delete from hits_hour`]);
    return;
  }
  queue = queue.then(() => Promise.all([FILE, HOUR_FILE].map((f) => writeFile(f, "{}").catch(() => {}))));
  await queue;
}
