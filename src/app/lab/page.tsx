import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faceplate } from "@/components/faceplate";
import {
  DEFAULT_SITE, FONTS, HANDLES, ICONS, PRESETS, SCENES, SOCIALS, TRIMS, siteSchema,
  type Link, type Site, type Theme,
} from "@/lib/site";

// Dev-only stress fixtures for the public workshop page. Never served in production.
export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

// Schema limits: name 60, bio 160, label 60, 40 links, 6 socials.
const LONG_NAME = "Bengkel Las & Bubut Sinar Jaya Abadi Makmur Sentosa Bersama!";
const UNBROKEN_NAME = "PT.SinarJayaAbadiMakmurSentosaBersamaTeknikIndonesia".padEnd(60, "X");
const LONG_BIO = "Melayani servis harian, perbaikan mesin diesel, las argon, bubut presisi, dan pengadaan suku cadang untuk armada truk di wilayah Kalimantan Timur dan sekitarnya.".slice(0, 160);

const hostileLinks: Link[] = [
  { id: "h1", label: "https://example.com/katalog/suku-cadang/2024/edisi-revisi-final", url: "https://example.com", icon: "globe", on: true, lit: true },
  { id: "h2", label: "Formulir pengajuan perbaikan unit dan klaim garansi pabrikan", url: "https://example.com/a", icon: "file", on: true, lit: false },
  { id: "h3", label: "تواصل معنا عبر واتساب للحصول على الدعم الفني", url: "https://wa.me/620000000000", icon: "whatsapp", on: true, lit: false },
  { id: "h4", label: "公式サイトはこちらからご覧ください", url: "https://example.jp", icon: "link", on: true, lit: false },
  { id: "h5", label: "Promo 🎉 akhir tahun 🔥🔥", url: "https://example.com/promo", icon: "shop", on: true, lit: false },
  { id: "h6", label: "Jo", url: "mailto:jo@example.com", icon: "email", on: true, lit: false },
  { id: "h7", label: "Tersembunyi", url: "https://example.com/hidden", icon: "link", on: false, lit: false },
].map((l) => ({ ...l, label: l.label.slice(0, 60) }) as Link);

const forty: Link[] = Array.from({ length: 40 }, (_, i) => ({
  id: `m${i}`, label: `Link nomor ${i + 1}`, url: `https://example.com/${i}`, icon: ICONS[i % ICONS.length], on: true, lit: i % 9 === 0,
}));

const sixSocials = SOCIALS.slice(0, 6).map((kind, i) => ({ id: `s${i}`, kind, url: "https://example.com" }));

function site(theme: Partial<Theme>, rest: Partial<Site> = {}): Site {
  return siteSchema.parse({
    profile: { name: LONG_NAME, bio: LONG_BIO, avatar: "" },
    links: hostileLinks,
    socials: DEFAULT_SITE.socials,
    ...rest,
    theme: { ...DEFAULT_SITE.theme, ...theme },
  });
}

const preset = (key: string) => ({ preset: key, base: PRESETS[key].base, led: PRESETS[key].led });

const fixtures: [string, Site][] = [
  ...Object.keys(PRESETS).map((key) => [`preset ${key}`, site(preset(key))] as [string, Site]),
  ...["#ffffff", "#000000", "#ffff00"].map((base) => [`custom paint ${base}`, site({ preset: "custom", base })] as [string, Site]),
  ...HANDLES.map((handle) => [`handle ${handle}`, site({ handle })] as [string, Site]),
  ...SCENES.map((scene) => [`scene ${scene}`, site({ scene })] as [string, Site]),
  ...TRIMS.map((trim) => [`trim ${trim}`, site({ ...preset("hitam"), trim })] as [string, Site]),
  ...FONTS.map((font) => [`font ${font}`, site({ font })] as [string, Site]),
  ["radio off · radius 0 · depth 0", site({ radio: false, radius: 0, depth: 0 })],
  ["radius 28 · depth 1 · kuning · tab", site({ ...preset("kuning"), radius: 28, depth: 1, handle: "tab" })],
  ["unbroken 60-char name · no bio", site({}, { profile: { name: UNBROKEN_NAME, bio: "", avatar: "" } })],
  ["0 links · 0 socials", site({}, { links: [], socials: [] })],
  ["broken avatar URL", site({}, { profile: { name: "Avatar Rusak", bio: "", avatar: "https://example.invalid/avatar.png" } })],
  ["40 links · 6 socials · cup", site({ handle: "cup" }, { links: forty, socials: sixSocials })],
];

export default function Lab() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="lab">
      <style>{`.lab > section > p { margin: 0; padding: 8px 16px; font: 600 13px/1.4 system-ui; background: #111; color: #fff; }
.lab > section { position: relative; }`}</style>
      {fixtures.map(([title, s]) => (
        <section key={title} aria-label={title}>
          <p>{title}</p>
          {/* contained: a fixed scene per fixture would stack twenty-five viewport-sized planes on top of each other */}
          <Faceplate site={s} contained />
        </section>
      ))}
    </div>
  );
}
