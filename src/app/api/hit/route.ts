import { EVENT_KEYS, isLinkKey, recordHit } from "@/lib/analytics";
import { getSite } from "@/lib/store";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless/i;

// ponytail: per-instance limiter; a shared store if deployed multi-instance.
const seen = new Map<string, { n: number; until: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const s = seen.get(ip);
  if (!s || s.until < now) {
    seen.set(ip, { n: 1, until: now + 60_000 });
    if (seen.size > 5000) seen.clear();
    return false;
  }
  return ++s.n > 60;
}

/** Counts one tap. Body is the plain-text key (sent with navigator.sendBeacon). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return new Response(null, { status: 403 });
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return new Response(null, { status: 429 });

  const k = (await req.text()).trim().slice(0, 48);
  const site = await getSite();
  const known =
    (EVENT_KEYS as readonly string[]).includes(k) || (isLinkKey(k) && site.link.some((l) => `l:${l.id}` === k));
  if (!known) return new Response(null, { status: 400 });

  await recordHit(k, site.status.zona);
  return new Response(null, { status: 204 });
}
