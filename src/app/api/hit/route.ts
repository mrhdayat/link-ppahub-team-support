import { EVENT_KEYS, deviceOf, isLinkKey, isSrcKey, recordHit, srcAllowed } from "@/lib/analytics";
import { getPublicSite } from "@/lib/store";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless/i;

// ponytail: per-instance limiter; a shared store if deployed multi-instance.
// Forwarded IPs can be spoofed, so a global ceiling caps total writes whatever IP is claimed;
// the worst case is inflated counts, never data loss. Expired entries are evicted, never the whole map.
const seen = new Map<string, { n: number; until: number }>();
const PER_IP = 60;
const GLOBAL = 1200;
let global = { n: 0, until: 0 };
function limited(ip: string): boolean {
  const now = Date.now();
  if (global.until < now) global = { n: 0, until: now + 60_000 };
  if (++global.n > GLOBAL) return true;
  if (seen.size > 5000) for (const [k, v] of seen) if (v.until < now) seen.delete(k);
  if (seen.size > 5000) return true; // still full of live entries: refuse rather than forget them
  const s = seen.get(ip);
  if (!s || s.until < now) {
    seen.set(ip, { n: 1, until: now + 60_000 });
    return false;
  }
  return ++s.n > PER_IP;
}

/**
 * Counts one tap. Body is the plain-text key (sent with navigator.sendBeacon).
 * A "view" also counts the device class (dev:*) from the User-Agent; the UA itself is never stored.
 * "src:<slug>" keys are any slug, but only SRC_MAX distinct ones a day: past that, new slugs are ignored.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return new Response(null, { status: 403 });
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return new Response(null, { status: 429 });

  const k = (await req.text()).trim().slice(0, 48);
  const site = await getPublicSite(); // archived links take no taps
  const known =
    (EVENT_KEYS as readonly string[]).includes(k) || (isLinkKey(k) && site.link.some((l) => `l:${l.id}` === k)) || isSrcKey(k);
  if (!known) return new Response(null, { status: 400 });
  if (isSrcKey(k) && !(await srcAllowed(k, site.status.zona))) return new Response(null, { status: 204 });

  await recordHit(k, site.status.zona);
  if (k === "view") await recordHit(`dev:${deviceOf(ua)}`, site.status.zona);
  return new Response(null, { status: 204 });
}
