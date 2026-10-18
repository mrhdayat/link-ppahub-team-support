// Creates the Neon tables and seeds the page CONFIG. Run: npm run db:setup [-- --force]
// Reads DATABASE_URL from .env.local. Safe to re-run: without --force an existing CONFIG is kept.
import { readFile } from "node:fs/promises";
import { ensureSchema, sql } from "../src/lib/db";
import { DEFAULT_SITE, siteSchema, type Site } from "../src/lib/site";

async function main() {
  if (!sql) throw new Error("DATABASE_URL belum diisi di .env.local");
  await ensureSchema();

  // Prefer the local file store so edits made before Neon carry over; else the built-in content.
  let site: Site = DEFAULT_SITE;
  let from = "src/lib/default-site.json";
  try {
    site = siteSchema.parse(JSON.parse(await readFile("data/site.json", "utf8")));
    from = "data/site.json";
  } catch {}

  const value = JSON.stringify(site);
  const rows = process.argv.includes("--force")
    ? await sql`insert into site_doc (key, value) values ('site', ${value}::jsonb)
        on conflict (key) do update set value = excluded.value, updated_at = now() returning key`
    : await sql`insert into site_doc (key, value) values ('site', ${value}::jsonb) on conflict (key) do nothing returning key`;

  console.log(
    rows.length
      ? `CONFIG disimpan ke Neon dari ${from}: ${site.kategori.length} kategori, ${site.link.length} tautan.`
      : "CONFIG sudah ada di Neon, tidak ditimpa. Pakai --force untuk menimpanya.",
  );
  const [{ n }] = (await sql`select count(*)::int as n from hits`) as { n: number }[];
  console.log(`Tabel siap: site_doc, hits (${n} baris statistik).`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
