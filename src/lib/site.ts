import { z } from "zod";
import { inkFor, luminance, mix, softInkFor } from "./color";

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
export const FONTS = ["archivo", "barlow", "bricolage"] as const;
export const KEY_STYLES = ["raised", "recessed", "pill"] as const;

export const linkSchema = z.object({
  id,
  label: z.string().trim().min(1, "Nama tombol wajib diisi").max(60),
  url,
  icon: z.enum(ICONS).default("link"),
  on: z.boolean().default(true),
  lit: z.boolean().default(false),
});

export const socialSchema = z.object({ id, kind: z.enum(SOCIALS), url });

export const themeSchema = z.object({
  preset: z.string().max(20),
  base: hex,
  led: hex,
  radius: z.number().min(0).max(28),
  depth: z.number().min(0).max(1),
  font: z.enum(FONTS),
  keyStyle: z.enum(KEY_STYLES),
  grille: z.boolean(),
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
  socials: z.array(socialSchema).max(12),
  theme: themeSchema,
});

export type Site = z.infer<typeof siteSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Theme = z.infer<typeof themeSchema>;

export const PRESETS: Record<string, { label: string; base: string; led: string }> = {
  kapur: { label: "Kapur", base: "#dfe2e5", led: "#1fb46a" },
  grafit: { label: "Grafit", base: "#2c2e33", led: "#ffb547" },
  zaitun: { label: "Zaitun", base: "#b9bca4", led: "#f7c548" },
  baja: { label: "Baja", base: "#a9b7c6", led: "#e8453c" },
};

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
  theme: { preset: "kapur", ...pick(PRESETS.kapur), radius: 14, depth: 0.7, font: "archivo", keyStyle: "raised", grille: true },
};

function pick(p: { base: string; led: string }) {
  return { base: p.base, led: p.led };
}

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
    colorScheme: light ? "light" : "dark",
  };
}
