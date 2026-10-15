import { connection } from "next/server";
import { isLinkKey, readDays, totals } from "@/lib/analytics";
import { getSite } from "@/lib/store";

/** Public all-time tap count per link id, only when the owner chose to show counts. */
export async function GET() {
  await connection(); // counts change per request; never prerender this
  const site = await getSite();
  if (!site.tampilKlik) return Response.json({});
  const t = totals(await readDays());
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(t)) if (isLinkKey(k)) out[k.slice(2)] = n;
  return Response.json(out, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
