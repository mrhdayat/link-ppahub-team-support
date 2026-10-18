import { neon } from "@neondatabase/serverless";

// Neon Postgres when DATABASE_URL is set; callers fall back to local JSON files otherwise.
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

let ready: Promise<unknown> | undefined;

/**
 * Both tables, created once per server instance. After `npm run db:setup` this is a cheap no-op,
 * and a fresh database still works on first request.
 */
export function ensureSchema(): Promise<unknown> {
  ready ??= Promise.all([
    // One JSON document holds the whole page CONFIG (key 'site').
    sql!`create table if not exists site_doc (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`,
    // Aggregate tap counters: one row per (day in the owner's zone, key). No visitor data.
    sql!`create table if not exists hits (day date not null, k text not null, n integer not null default 0, primary key (day, k))`,
  ]).catch((e) => {
    ready = undefined; // let the next request retry instead of caching the failure
    throw e;
  });
  return ready;
}
