import { z } from "zod";

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
const slug = z.string().trim().regex(/^[a-z0-9-]{1,24}$/, "ID kategori: huruf kecil, angka, atau tanda hubung");

export const WARNA = ["green", "blue", "red", "yellow", "white"] as const;
export const LABELS = ["baru", "populer", "promo"] as const;
export const STATUS = ["hijau", "kuning", "merah"] as const;
/** Indonesian time zones. Opening hours and label dates are the owner's, not the visitor's. */
export const ZONA = { "Asia/Jakarta": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" } as const;
export type Zona = keyof typeof ZONA;

export const kategoriSchema = z.object({
  id: slug,
  nama: z.string().trim().min(1, "Nama kategori wajib diisi").max(24),
  warna: z.enum(WARNA),
});

export const linkSchema = z.object({
  id,
  judul: z.string().trim().min(1, "Judul wajib diisi").max(48),
  url,
  kategori: slug,
  catatan: z.string().trim().max(60).default(""),
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
    whatsapp: z.union([z.literal(""), url.refine((u) => /^https:\/\/wa\.me\/\d{8,15}/.test(u), "Format WhatsApp: https://wa.me/62…")]),
    teksBerjalan: z.array(z.string().trim().min(1).max(60)).max(6),
    kategori: z.array(kategoriSchema).max(12),
    link: z.array(linkSchema).max(200),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.kategori.map((k) => k.id));
    if (ids.size !== s.kategori.length) ctx.addIssue({ code: "custom", path: ["kategori"], message: "ID kategori tidak boleh kembar" });
    s.link.forEach((l, i) => {
      if (!ids.has(l.kategori)) ctx.addIssue({ code: "custom", path: ["link", i, "kategori"], message: `Kategori "${l.kategori}" tidak ada` });
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
export type StatusWarna = (typeof STATUS)[number];

export const DEFAULT_SITE: Site = {
  profil: { nama: "Team PPA", inisial: "TP", bio: "Contoh isi. Ganti nama, bio, dan tautan ini dari halaman admin." },
  status: { mode: "otomatis", zona: "Asia/Makassar", jamBuka: 9, jamTutup: 21, hariLibur: [0], manual: "hijau" },
  balasMaksJam: 24,
  whatsapp: "https://wa.me/620000000000",
  teksBerjalan: ["Jalur kreatif aktif", "Konten baru tiap minggu"],
  kategori: [
    { id: "sosial", nama: "Sosial", warna: "green" },
    { id: "karya", nama: "Karya", warna: "blue" },
    { id: "toko", nama: "Toko", warna: "red" },
    { id: "belajar", nama: "Belajar", warna: "yellow" },
  ],
  link: [
    { id: "l1", judul: "Portofolio", url: "https://example.com/portofolio", kategori: "karya", catatan: "karya pilihan", utama: true },
    { id: "l2", judul: "Toko online", url: "https://example.com/toko", kategori: "toko", catatan: "stiker, cetak, merch", utama: true },
    { id: "l3", judul: "Instagram", url: "https://instagram.com", kategori: "sosial", catatan: "@contoh", utama: false },
    { id: "l4", judul: "YouTube", url: "https://youtube.com", kategori: "sosial", catatan: "video terbaru", utama: false, label: "baru", labelSampai: "2026-12-31" },
  ],
};

/** Stored data that no longer fits (old theme formats, hand edits) falls back to the default instead of breaking the page. */
export function parseSite(raw: unknown): Site {
  const full = siteSchema.safeParse(raw);
  return full.success ? full.data : DEFAULT_SITE;
}

/** Label still showing on `today` (YYYY-MM-DD, local). */
export function activeLabel(l: Link, today: string): Link["label"] {
  return l.label && (!l.labelSampai || today <= l.labelSampai) ? l.label : undefined;
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
