import { notFound } from "next/navigation";
import { Faceplate } from "@/components/faceplate";
import { DEFAULT_SITE, FONTS, ICONS, KEY_STYLES, PRESETS, SOCIALS, siteSchema, type Link, type Site, type Theme } from "@/lib/site";

// Dev-only stress fixtures for the public faceplate. Never served in production.
export const metadata = { robots: { index: false } };

const LONG_NAME = "Supercalifragilisticexpialidocious".padEnd(60, "X");
const LONG_BIO = ("Bio panjang untuk uji pembungkusan teks pada pelat. ".repeat(4)).slice(0, 160);

const hostileLinks: Link[] = [
  { id: "h1", label: "https://example.com/very/long/path/without/any/spaces/at-all", url: "https://example.com", icon: "globe", on: true, lit: true },
  { id: "h2", label: "Label yang sangat panjang sekali untuk menguji pembungkusan baris", url: "https://example.com/a", icon: "file", on: true, lit: false },
  { id: "h3", label: "تواصل معنا عبر واتساب للحصول على الدعم", url: "https://wa.me/620000000000", icon: "whatsapp", on: true, lit: false },
  { id: "h4", label: "公式サイトはこちらからご覧ください", url: "https://example.jp", icon: "link", on: true, lit: false },
  { id: "h5", label: "Promo 🎉 akhir tahun 🔥🔥", url: "https://example.com/promo", icon: "shop", on: true, lit: false },
  { id: "h6", label: "Hubungi kami", url: "mailto:tim@example.com", icon: "email", on: true, lit: false },
  { id: "h7", label: "Tersembunyi", url: "https://example.com/hidden", icon: "link", on: false, lit: false },
].map((l) => ({ ...l, label: l.label.slice(0, 60) }) as Link);

const forty: Link[] = Array.from({ length: 40 }, (_, i) => ({
  id: `m${i}`, label: `Link nomor ${i + 1}`, url: `https://example.com/${i}`, icon: ICONS[i % ICONS.length], on: true, lit: i % 9 === 0,
}));

const twelveSocials = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, kind: SOCIALS[i % SOCIALS.length], url: "https://example.com" }));

function site(theme: Partial<Theme>, rest: Partial<Site> = {}): Site {
  return siteSchema.parse({
    profile: { name: LONG_NAME, bio: LONG_BIO, avatar: "" },
    links: hostileLinks,
    socials: DEFAULT_SITE.socials,
    ...rest,
    theme: { ...DEFAULT_SITE.theme, ...theme },
  });
}

const fixtures: [string, Site][] = [
  ...Object.entries(PRESETS).map(([key, p]) => [`preset ${key}`, site({ preset: key, base: p.base, led: p.led })] as [string, Site]),
  ...["#ffffff", "#000000", "#808080", "#ff0000"].map((base) => [`custom ${base}`, site({ preset: "custom", base })] as [string, Site]),
  ...KEY_STYLES.map((keyStyle) => [`keys ${keyStyle}`, site({ keyStyle })] as [string, Site]),
  ...FONTS.map((font) => [`font ${font}`, site({ font })] as [string, Site]),
  ["grille off, radius 0, depth 0", site({ grille: false, radius: 0, depth: 0 })],
  ["radius 28, depth 1, grafit", site({ radius: 28, depth: 1, base: PRESETS.grafit.base, led: PRESETS.grafit.led })],
  ["empty: 0 links", site({}, { links: [] })],
  ["broken avatar", site({}, { profile: { name: "Avatar Rusak", bio: "", avatar: "https://example.invalid/avatar.png" } })],
  ["40 links, 12 socials", site({ keyStyle: "pill" }, { links: forty, socials: twelveSocials })],
];

export default function Lab() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="lab">
      <style>{`.lab .desk { min-height: auto; padding-block: 32px; }
.lab section > p { margin: 0; padding: 8px 16px; font: 600 13px/1.4 system-ui; background: #111; color: #fff; }`}</style>
      {fixtures.map(([title, s]) => (
        <section key={title} aria-label={title}>
          <p>{title}</p>
          <Faceplate site={s} />
        </section>
      ))}
    </main>
  );
}
