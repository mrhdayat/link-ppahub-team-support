import { z } from "zod";
import seed from "./default-site.json";

// Rambu Navigasi CONFIG. One document; the admin edits it, the public page renders it.

// Only schemes a visitor can safely open. Blocks javascript:, data:, etc.
const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];
export function isSafeUrl(value: string): boolean {
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const url = z.string().trim().max(2048).refine(isSafeUrl, "Link harus diawali https://, mailto: atau tel:");
const id = z.string().trim().min(1).max(40);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal: YYYY-MM-DD");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam: HH:MM");
const slug = z.string().trim().regex(/^[a-z0-9-]{1,24}$/, "ID kategori: huruf kecil, angka, atau tanda hubung");

export const WARNA = ["green", "blue", "red", "yellow", "white"] as const;
export const LABELS = ["baru", "populer", "promo"] as const;
export const STATUS = ["hijau", "kuning", "merah"] as const;
/** Pictogram on each lane plate; drawn in components/rambu/signs.tsx. */
export const IKON = ["simpan", "listrik", "air", "truk", "alat", "dokumen", "perisai", "umum"] as const;
/** Indonesian time zones. Opening hours and label dates are the owner's, not the visitor's. */
/** Page theme. "otomatis" follows the calendar (Agustus → HUT RI, 12 Jan–12 Feb → Bulan K3 Nasional). */
export const TEMA = ["otomatis", "standar", "hut-ri", "bulan-k3", "hut-ppa"] as const;
export const ZONA = { "Asia/Jakarta": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" } as const;
export type Zona = keyof typeof ZONA;

export const kategoriSchema = z.object({
  id: slug,
  nama: z.string().trim().min(1, "Nama kategori wajib diisi").max(24),
  warna: z.enum(WARNA),
  ikon: z.enum(IKON).catch("umum"),
});

export const linkSchema = z.object({
  id,
  judul: z.string().trim().min(1, "Judul wajib diisi").max(48),
  url,
  kategori: slug,
  // Extra lanes the same link also shows in (one link, one click count, several lanes).
  kategoriLain: z.array(slug).max(11).default([]),
  catatan: z.string().trim().max(60).default(""),
  // Search aliases, comma separated: "apd, sepatu, helm".
  kataKunci: z.string().trim().max(120).default(""),
  // Short how-to shown behind the ⓘ button.
  panduan: z.string().trim().max(280).default(""),
  // Date the link was added (owner's zone); drives the automatic BARU label.
  dibuat: date.optional().catch(undefined),
  utama: z.boolean().default(false),
  label: z.enum(LABELS).optional().catch(undefined),
  labelSampai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal label: YYYY-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const siteSchema = z
  .object({
    profil: z.object({
      nama: z.string().trim().min(1, "Nama wajib diisi").max(40),
      inisial: z.string().trim().min(1).max(2).transform((s) => s.toUpperCase()),
      bio: z.string().trim().max(140),
    }),
    // mode otomatis memakai jam; manual memakai nilai manual
    status: z.object({
      mode: z.enum(["otomatis", "manual"]),
      zona: z.enum(Object.keys(ZONA) as [Zona, ...Zona[]]).default("Asia/Makassar"),
      jamBuka: z.number().int().min(0).max(23),
      jamTutup: z.number().int().min(1).max(24),
      hariLibur: z.array(z.number().int().min(0).max(6)).max(7),
      manual: z.enum(STATUS),
    }),
    balasMaksJam: z.number().int().min(1).max(168),
    // show each sign's all-time tap count on the public page
    tampilKlik: z.boolean().default(true),
    whatsapp: z.union([z.literal(""), url.refine((u) => /^https:\/\/wa\.me\/\d{8,15}/.test(u), "Format WhatsApp: https://wa.me/62…")]),
    teksBerjalan: z.array(z.string().trim().min(1).max(60)).max(6),
    kategori: z.array(kategoriSchema).max(12),
    link: z.array(linkSchema).max(200),
    // K3 messages: a dated one wins on its day, undated ones rotate daily.
    safetyTalk: z.array(z.object({ teks: z.string().trim().min(1).max(120), tanggal: date.optional().catch(undefined) })).max(60).default([]),
    // Shift change times, owner's zone.
    shift: z.array(hhmm).max(4).default(["06:00", "18:00"]),
    // Weather for the HUD (Open-Meteo, no key). Coordinates of the site.
    cuaca: z
      .object({ aktif: z.boolean(), nama: z.string().trim().max(40), lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) })
      .default({ aktif: true, nama: "Site BIB", lat: -3.6, lon: 115.6 }),
    tema: z.enum(TEMA).default("otomatis"),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.kategori.map((k) => k.id));
    if (ids.size !== s.kategori.length) ctx.addIssue({ code: "custom", path: ["kategori"], message: "ID kategori tidak boleh kembar" });
    s.link.forEach((l, i) => {
      if (!ids.has(l.kategori)) ctx.addIssue({ code: "custom", path: ["link", i, "kategori"], message: `Kategori "${l.kategori}" tidak ada` });
      l.kategoriLain.forEach((k, j) => {
        if (!ids.has(k)) ctx.addIssue({ code: "custom", path: ["link", i, "kategoriLain", j], message: `Kategori "${k}" tidak ada` });
      });
    });
    if (s.link.filter((l) => l.utama).length > 2)
      ctx.addIssue({ code: "custom", path: ["link"], message: "Maksimal 2 tautan utama di papan gantry" });
    if (s.status.jamTutup <= s.status.jamBuka)
      ctx.addIssue({ code: "custom", path: ["status", "jamTutup"], message: "Jam tutup harus setelah jam buka" });
  });

export type Site = z.infer<typeof siteSchema>;
export type Kategori = z.infer<typeof kategoriSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Warna = (typeof WARNA)[number];
export type Ikon = (typeof IKON)[number];
export type StatusWarna = (typeof STATUS)[number];
export type Tema = (typeof TEMA)[number];

// The real page content; shown until the admin saves, and what `npm run db:setup` seeds into Neon.
export const DEFAULT_SITE: Site = siteSchema.parse(seed);

/** Stored data that no longer fits (old theme formats, hand edits) falls back to the default instead of breaking the page. */
export function parseSite(raw: unknown): Site {
  const full = siteSchema.safeParse(raw);
  return full.success ? full.data : DEFAULT_SITE;
}

/** Label still showing on `today` (YYYY-MM-DD, local). */
export function activeLabel(l: Link, today: string): Link["label"] {
  return l.label && (!l.labelSampai || today <= l.labelSampai) ? l.label : undefined;
}

/** Every lane a link shows in: its own category first, then the extra ones (no repeats). */
export const lanesOf = (l: Link): string[] => [...new Set([l.kategori, ...l.kategoriLain])];

/** Links shown in one lane, in CONFIG order. */
export const linksIn = (site: Site, kategoriId: string): Link[] => site.link.filter((l) => lanesOf(l).includes(kategoriId));

const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000;

/** Added within the last `days` days (today counts as day 0). */
export const isBaru = (l: Link, today: string, days = 7): boolean =>
  !!l.dibuat && dayNo(today) - dayNo(l.dibuat) >= 0 && dayNo(today) - dayNo(l.dibuat) < days;

/** The label a sign shows: the admin's label while it lasts, else BARU for freshly added links. */
export function labelFor(l: Link, today: string): Link["label"] {
  return activeLabel(l, today) ?? (isBaru(l, today) ? "baru" : undefined);
}

/** Opens only inside the office network: private IPv4 ranges, localhost, *.local / *.lan / *.internal. */
export function isOfficeOnly(url: string): boolean {
  let h: string;
  try {
    h = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (h === "localhost" || /\.(local|lan|internal)$/.test(h)) return true;
  const m = h.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Today's K3 message: one dated today wins, else undated ones take turns by day. */
export function safetyTalkFor(list: Site["safetyTalk"], today: string): string | undefined {
  const dated = list.find((t) => t.tanggal === today);
  if (dated) return dated.teks;
  const free = list.filter((t) => !t.tanggal);
  return free.length ? free[dayNo(today) % free.length].teks : undefined;
}

/** Next shift change after `now` (hour/minute on the owner's clock), wrapping past midnight. */
export function nextShift(shift: string[], hour: number, minute: number): { at: string; minutes: number } | undefined {
  if (!shift.length) return undefined;
  const now = hour * 60 + minute;
  const mins = shift.map((t) => {
    const m = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    return { at: t, minutes: (m - now + 1440) % 1440 || 1440 };
  });
  return mins.sort((a, b) => a.minutes - b.minutes)[0];
}

/** The theme in force on `today`. */
export function temaFor(tema: Tema, today: string): Exclude<Tema, "otomatis"> {
  if (tema !== "otomatis") return tema;
  const md = today.slice(5);
  if (md >= "08-01" && md <= "08-31") return "hut-ri";
  if ((md >= "01-12" && md <= "01-31") || (md >= "02-01" && md <= "02-12")) return "bulan-k3";
  return "standar";
}

/** Wall-clock parts of `now` in an IANA zone. */
export function clockIn(zona: Zona, now: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona, hourCycle: "h23", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(now).map((x) => [x.type, x.value]),
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, day, hour: Number(p.hour), minute: Number(p.minute) };
}

/** Open around the clock: 00.00 to 24.00. */
export const buka24 = (s: Site["status"]) => s.jamBuka === 0 && s.jamTutup === 24;

/** Traffic-light status for a moment in time, read on the owner's clock. */
export function statusAt(s: Site["status"], now: Date): StatusWarna {
  if (s.mode === "manual") return s.manual;
  const c = clockIn(s.zona, now);
  if (s.hariLibur.includes(c.day)) return "merah";
  return c.hour >= s.jamBuka && c.hour < s.jamTutup ? "hijau" : "kuning";
}

/** How a lane lays out its signs, from the PRD: 1–4 wide, 5–6 compact grid, 7+ compact with fold after 6. */
export function laneLayout(count: number): { compact: boolean; visible: number } {
  if (count <= 4) return { compact: false, visible: count };
  if (count <= 6) return { compact: true, visible: count };
  return { compact: true, visible: 6 };
}
