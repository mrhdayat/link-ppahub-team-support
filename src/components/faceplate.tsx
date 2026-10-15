import type { CSSProperties } from "react";
import {
  ArrowUpRight, Briefcase, CalendarBlank, Camera, EnvelopeSimple, FacebookLogo, FileText, Globe,
  InstagramLogo, LinkedinLogo, LinkSimple, MapPin, MusicNotes, Phone, Storefront, TiktokLogo,
  WhatsappLogo, XLogo, YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { themeVars, type Site } from "@/lib/site";
import "./faceplate.css";

export const ICON: Record<string, Icon> = {
  link: LinkSimple, globe: Globe, whatsapp: WhatsappLogo, instagram: InstagramLogo, tiktok: TiktokLogo,
  youtube: YoutubeLogo, linkedin: LinkedinLogo, x: XLogo, facebook: FacebookLogo, email: EnvelopeSimple,
  phone: Phone, map: MapPin, file: FileText, calendar: CalendarBlank, briefcase: Briefcase, shop: Storefront,
  music: MusicNotes, camera: Camera,
};

export const SOCIAL_NAME: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", whatsapp: "WhatsApp", linkedin: "LinkedIn",
  x: "X", facebook: "Facebook", email: "Email", globe: "Website",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

/**
 * The hi-fi unit. Pure render: used by the public page (server) and the admin live preview (client).
 * `boot` plays the power-on LED sweep once; the preview turns it off so edits don't replay it.
 */
export function Faceplate({ site, boot = true, className = "" }: { site: Site; boot?: boolean; className?: string }) {
  const { profile, socials, theme } = site;
  const links = site.links.filter((l) => l.on);
  const style = themeVars(theme) as CSSProperties;

  return (
    <div className={`desk ${className}`} style={style} data-font={theme.font} data-keys={theme.keyStyle} data-boot={boot || undefined}>
      <article className="unit" aria-label={profile.name}>
        <span className="screw" data-pos="tl" aria-hidden />
        <span className="screw" data-pos="tr" aria-hidden />

        <header className="head">
          {theme.grille && <div className="grille" aria-hidden />}
          <div className="cone" data-grille={theme.grille || undefined}>
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL or inline data image
              <img src={profile.avatar} alt="" width={96} height={96} />
            ) : (
              <span aria-hidden>{initials(profile.name)}</span>
            )}
          </div>
          <h1 className="name">{profile.name}</h1>
          {profile.bio && <p className="bio">{profile.bio}</p>}

          {socials.length > 0 && (
            <ul className="tacts" aria-label="Media sosial">
              {socials.map((s) => {
                const I = ICON[s.kind] ?? Globe;
                return (
                  <li key={s.id}>
                    <a className="tact" href={s.url} aria-label={SOCIAL_NAME[s.kind] ?? s.kind}>
                      <I size={19} weight="bold" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        {links.length > 0 ? (
          <ul className="keys">
            {links.map((l, i) => {
              const I = ICON[l.icon] ?? LinkSimple;
              return (
                <li key={l.id} style={{ "--i": i } as CSSProperties}>
                  <a className="key" href={l.url} data-lit={l.lit || undefined}>
                    <span className="led" aria-hidden />
                    <I className="glyph" size={20} weight="regular" aria-hidden />
                    <span className="label">{l.label}</span>
                    <ArrowUpRight className="go" size={16} weight="bold" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">Belum ada link yang ditampilkan.</p>
        )}

        <footer className="foot" aria-hidden style={{ "--i": links.length } as CSSProperties}>
          <span className="power" />
        </footer>
        <span className="screw" data-pos="bl" aria-hidden />
        <span className="screw" data-pos="br" aria-hidden />
      </article>
    </div>
  );
}
