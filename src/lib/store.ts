import { cacheLife, cacheTag } from "next/cache";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, sql } from "./db";
import { DEFAULT_SITE, parseSite, publik, type Site } from "./site";

// One document holds the whole page. Neon when DATABASE_URL is set, a local JSON file otherwise.
// ponytail: local file only works on a persistent disk (dev / VPS); serverless deploys need DATABASE_URL.
const FILE = path.join(process.cwd(), "data", "site.json");
const HISTORY_FILE = path.join(process.cwd(), "data", "site-history.json");
const KEEP = 50;

/** A CONFIG as it was just before a save replaced it. `value` is unparsed: older schemas may not fit today's. */
export type Version = { id: number; value: unknown; savedAt: string; note: string | null };

async function readRaw(): Promise<unknown> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`select value from site_doc where key = 'site'`;
    return rows[0]?.value ?? null;
  }
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return null;
  }
}

export async function getSite(): Promise<Site> {
  "use cache";
  cacheTag("site");
  cacheLife("max");
  const raw = await readRaw();
  return raw ? parseSite(raw) : DEFAULT_SITE;
}

async function readHistoryFile(): Promise<Version[]> {
  try {
    return JSON.parse(await readFile(HISTORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

// ponytail: file history is read-modify-write without a lock; one admin on one dev/VPS process.
/** Saves the CONFIG, first keeping the one it replaces (skipped when nothing changed). `note` labels that kept copy. */
/** What visitors may see: archived links removed on the server, before anything crosses to the client. */
export async function getPublicSite(): Promise<Site> {
  return publik(await getSite());
}

export async function saveSite(site: Site, note?: string): Promise<void> {
  const value = JSON.stringify(site);
  if (sql) {
    await ensureSchema();
    await sql.transaction([
      sql`insert into site_history (value, note) select value, ${note ?? null} from site_doc
        where key = 'site' and value is distinct from ${value}::jsonb`,
      sql`insert into site_doc (key, value) values ('site', ${value}::jsonb)
        on conflict (key) do update set value = excluded.value, updated_at = now()`,
      sql`delete from site_history where id not in (select id from site_history order by id desc limit ${KEEP})`,
    ]);
    return;
  }
  const prev = await readRaw();
  await mkdir(path.dirname(FILE), { recursive: true });
  if (prev && JSON.stringify(prev) !== value) {
    const list = await readHistoryFile();
    const id = (list[0]?.id ?? 0) + 1;
    await writeFile(HISTORY_FILE, JSON.stringify([{ id, value: prev, savedAt: new Date().toISOString(), note: note ?? null }, ...list].slice(0, KEEP)));
  }
  await writeFile(FILE, JSON.stringify(site, null, 2));
}

/** Kept versions, newest first. */
export async function readHistory(): Promise<Version[]> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`select id, value, saved_at, note from site_history order by id desc limit ${KEEP}`) as {
      id: string; value: unknown; saved_at: Date | string; note: string | null;
    }[];
    return rows.map((r) => ({ id: Number(r.id), value: r.value, savedAt: new Date(r.saved_at).toISOString(), note: r.note }));
  }
  return readHistoryFile();
}

export async function readVersion(id: number): Promise<unknown> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`select value from site_history where id = ${id}`;
    return rows[0]?.value ?? null;
  }
  return (await readHistoryFile()).find((v) => v.id === id)?.value ?? null;
}

/** The stored CONFIG, uncached: the history diff must compare against what is really saved now. */
export async function readCurrent(): Promise<Site> {
  const raw = await readRaw();
  return raw ? parseSite(raw) : DEFAULT_SITE;
}
