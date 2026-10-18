import { cacheLife, cacheTag } from "next/cache";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, sql } from "./db";
import { DEFAULT_SITE, parseSite, type Site } from "./site";

// One document holds the whole page. Neon when DATABASE_URL is set, a local JSON file otherwise.
// ponytail: local file only works on a persistent disk (dev / VPS); serverless deploys need DATABASE_URL.
const FILE = path.join(process.cwd(), "data", "site.json");

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

export async function saveSite(site: Site): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`insert into site_doc (key, value) values ('site', ${JSON.stringify(site)}::jsonb)
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(site, null, 2));
}
