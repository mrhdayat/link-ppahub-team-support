import { z } from "zod";
import { contrast, inkFor, luminance, mix, softInkFor } from "./color";

// Only schemes a visitor can safely open. Blocks javascript:, data:, etc.
const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];
export function isSafeUrl(value: string): boolean {
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB");
const url = z.string().trim().max(2048).refine(isSafeUrl, "Link harus diawali https://, mailto: atau tel:");
const id = z.string().min(1).max(40);

export const ICONS = [
  "link", "globe", "whatsapp", "instagram", "tiktok", "youtube", "linkedin", "x", "facebook",
  "email", "phone", "map", "file", "calendar", "briefcase", "shop", "music", "camera",
] as const;
export const SOCIALS = ["instagram", "tiktok", "youtube", "whatsapp", "linkedin", "x", "facebook", "email", "globe"] as const;
export const FONTS = ["barlow", "shoulders", "archivo"] as const;
export const HANDLES = ["bar", "cup", "tab"] as const;
export const SCENES = ["garasi", "malam", "polos"] as const;
export const TRIMS = ["krom", "hitam"] as const;

export const linkSchema = z.object({
  id,
  label: z.string().trim().min(1, "Nama tombol wajib diisi").max(60),
  url,
  icon: z.enum(ICONS).default("link"),
  on: z.boolean().default(true),
  lit: z.boolean().default(false),
});

export const socialSchema = z.object({ id, kind: z.enum(SOCIALS), url });

/** Cabinet paint + display glow. Each preset is a real-world tool-chest finish. */
export const PRESETS: Record<string, { label: string; base: string; led: string }> = {
  merah: { label: "Merah bengkel", base: "#b0281f", led: "#5ef2c8" },
  hitam: { label: "Hitam doff", base: "#26282c", led: "#ffb547" },
  biru: { label: "Biru baja", base: "#2c5a86", led: "#8fe3ff" },
  hijau: { label: "Hijau army", base: "#4f5b3c", led: "#a6ff7a" },
  kuning: { label: "Kuning safety", base: "#d9a21b", led: "#ff8a3d" },
};

export const DEFAULT_THEME = {
  preset: "merah",
  base: PRESETS.merah.base,
  led: PRESETS.merah.led,
  radius: 10,
  depth: 0.75,
  font: "barlow" as (typeof FONTS)[number],
  handle: "bar" as (typeof HANDLES)[number],
  scene: "garasi" as (typeof SCENES)[number],
  trim: "krom" as (typeof TRIMS)[number],
  radio: true,
};

// Every field degrades on its own, so an old or hand-edited theme keeps whatever is still valid.
export const themeSchema = z.object({
  preset: z.string().max(20).catch(DEFAULT_THEME.preset),
  base: hex.catch(DEFAULT_THEME.base),
  led: hex.catch(DEFAULT_THEME.led),
  radius: z.number().min(0).max(28).catch(DEFAULT_THEME.radius),
  depth: z.number().min(0).max(1).catch(DEFAULT_THEME.depth),
  font: z.enum(FONTS).catch(DEFAULT_THEME.font),
  handle: z.enum(HANDLES).catch(DEFAULT_THEME.handle),
  scene: z.enum(SCENES).catch(DEFAULT_THEME.scene),
  trim: z.enum(TRIMS).catch(DEFAULT_THEME.trim),
  radio: z.boolean().catch(DEFAULT_THEME.radio),
});

// Avatar may be an https URL or a small inline image produced by the editor.
const avatar = z.union([
  z.literal(""),
  url,
  z.string().max(200_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
]);

export const siteSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(1, "Nama wajib diisi").max(60),
    bio: z.string().trim().max(160),
    avatar,
  }),
  links: z.array(linkSchema).max(40),
  // A head unit has six preset keys.
  socials: z.preprocess((v) => (Array.isArray(v) ? v.slice(0, 6) : v), z.array(socialSchema).max(6, "Maksimal 6 tombol preset")),
  theme: themeSchema,
});

export type Site = z.infer<typeof siteSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Theme = z.infer<typeof themeSchema>;


export const DEFAULT_SITE: Site = {
  profile: {
    name: "Team PPA",
    bio: "Contoh isi. Ganti nama, bio, dan link ini dari halaman admin.",
    avatar: "",
  },
  links: [
    { id: "l1", label: "Website resmi", url: "https://example.com", icon: "globe", on: true, lit: true },
    { id: "l2", label: "Hubungi via WhatsApp", url: "https://wa.me/620000000000", icon: "whatsapp", on: true, lit: false },
    { id: "l3", label: "Formulir pengajuan", url: "https://example.com/form", icon: "file", on: true, lit: false },
    { id: "l4", label: "Lokasi kantor", url: "https://maps.google.com", icon: "map", on: true, lit: false },
  ],
  socials: [
    { id: "s1", kind: "instagram", url: "https://instagram.com" },
    { id: "s2", kind: "linkedin", url: "https://linkedin.com" },
    { id: "s3", kind: "youtube", url: "https://youtube.com" },
  ],
  theme: DEFAULT_THEME,
};

/** Old or partial stored data never breaks the page: fall back per section. */
export function parseSite(raw: unknown): Site {
  const full = siteSchema.safeParse(raw);
  if (full.success) return full.data;
  const r = (raw ?? {}) as Partial<Record<keyof Site, unknown>>;
  const part = <K extends keyof Site>(k: K) => {
    const p = siteSchema.shape[k].safeParse(r[k]);
    return p.success ? p.data : DEFAULT_SITE[k];
  };
  return { profile: part("profile"), links: part("links"), socials: part("socials"), theme: part("theme") } as Site;
}

/** Every color the faceplate needs, derived from two picks so contrast can't be broken by the admin. */
export function themeVars(t: Theme): Record<string, string> {
  // Pure black can't cast a darker shadow or hold a darker LED cell, so lift it a hair.
  const base = luminance(t.base) < 0.012 ? mix(t.base, "#ffffff", 0.14) : t.base;
  const light = luminance(base) > 0.18;
  const faceTop = mix(base, "#ffffff", light ? 0.22 : 0.06);
  const faceBottom = mix(base, "#000000", light ? 0.03 : 0.12);
  // Text sits on the base and on both ends of the key/plate gradient: clear AA on all three.
  const surfaces = [base, faceTop, faceBottom];
  const ink = inkFor(base, surfaces);
  const d = t.depth;
  // The glow is VFD text, focus ring and LED: lift a dark pick toward white until it reads on the glass and in the gaps.
  const gap = mix(base, "#000000", 0.82);
  let glow = t.led;
  for (let k = 0.08; (contrast(glow, "#060708") < 4.5 || contrast(glow, gap) < 3) && k <= 1; k += 0.08) glow = mix(t.led, "#ffffff", k);
  return {
    "--base": base,
    "--ground": mix(base, "#000000", light ? 0.07 : 0.32),
    "--ink": ink,
    "--ink-soft": softInkFor(base, ink, surfaces),
    "--hi": mix(base, "#ffffff", (light ? 0.75 : 0.1) * d),
    "--lo": mix(base, "#000000", (light ? 0.2 : 0.55) * d),
    "--face-top": faceTop,
    "--face-bottom": faceBottom,
    "--led": t.led,
    "--led-off": mix(base, "#000000", light ? 0.16 : 0.35),
    "--radius": `${t.radius}px`,
    "--depth": String(d),
    // Tool chest: powder-coated paint, the gaps between drawers, the display glow, the metal trim.
    "--paint": base,
    "--paint-hi": mix(base, "#ffffff", light ? 0.35 : 0.2),
    "--paint-lo": mix(base, "#000000", 0.38),
    "--paint-edge": mix(base, "#000000", 0.62),
    "--gap": gap,
    "--glow": glow,
    "--glow-dim": mix(glow, "#0b0d0e", 0.86),
    "--glow-soft": mix(glow, "#0b0d0e", 0.45),
    ...(t.trim === "hitam"
      ? { "--metal-1": "#5b5f66", "--metal-2": "#303338", "--metal-3": "#151618" }
      : { "--metal-1": "#f7f8fa", "--metal-2": "#b6bdc5", "--metal-3": "#5d646d" }),
    colorScheme: light ? "light" : "dark",
  };
}
