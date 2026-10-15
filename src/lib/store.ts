import { cacheLife, cacheTag } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SITE, parseSite, type Site } from "./site";

// One document holds the whole page. Neon when DATABASE_URL is set, a local JSON file otherwise.
// ponytail: local file only works on a persistent disk (dev / VPS); serverless deploys need DATABASE_URL.
const FILE = path.join(process.cwd(), "data", "site.json");
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

async function ensureTable() {
  await sql!`create table if not exists site_doc (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
}

async function readRaw(): Promise<unknown> {
  if (sql) {
    await ensureTable();
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

export async function saveSite(site: Site): Promise<void> {
  if (sql) {
    await ensureTable();
    await sql`insert into site_doc (key, value) values ('site', ${JSON.stringify(site)}::jsonb)
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(site, null, 2));
}
