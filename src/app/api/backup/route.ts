import { connection } from "next/server";
import { readCurrent } from "@/lib/store";
import { bearerOk } from "./token";

/**
 * Weekly backup (.github/workflows/backup.yml): the whole CONFIG, archived links included, for restore.
 * Only the page content: no analytics, history or admin secret. Anything but the right token looks like a missing route.
 */
export async function GET(req: Request) {
  await connection();
  if (!bearerOk(req.headers.get("authorization"), process.env.BACKUP_TOKEN))
    return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
  const body = { exportedAt: new Date().toISOString(), ...(await readCurrent()) };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
