import type { CSSProperties } from "react";
import {
  Briefcase, CalendarBlank, Camera, EnvelopeSimple, FacebookLogo, FileText, Globe,
  InstagramLogo, LinkedinLogo, LinkSimple, MapPin, MusicNotes, Phone, Storefront, TiktokLogo,
  WhatsappLogo, XLogo, YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { themeVars, type Site } from "@/lib/site";
import { ConeAvatar } from "./cone-avatar";
import { RadioDisplay } from "./radio-display";
import { PegboardTools } from "./pegboard-tools";
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
 * The workshop: a truck head-unit radio standing on a mechanic's tool chest, against a pegboard wall.
 * Pure render (server on the public page, client in the admin preview).
 * `boot` plays the opening sequence once; `contained` keeps the scene inside its parent box.
 */
export function Faceplate({ site, boot = true, contained = false, className = "" }: {
  site: Site;
  boot?: boolean;
  /** Render the scene inside its parent box (admin preview) instead of filling the viewport. */
  contained?: boolean;
  className?: string;
}) {
  const { profile, socials, theme } = site;
  const links = site.links.filter((l) => l.on);
  const style = themeVars(theme) as CSSProperties;
  const presets = Array.from({ length: 6 }, (_, i) => socials[i]);

  return (
    <div
      className={`shop ${className}`}
      style={style}
      data-scene={theme.scene}
      data-font={theme.font}
      data-handle={theme.handle}
      data-boot={boot || undefined}
      data-contained={contained || undefined}
    >
      <div className="scene" aria-hidden>
        <div className="wall">
          <PegboardTools />
        </div>
        <div className="lamp-track">
          <div className="lamp" />
        </div>
      </div>

      <main className="rig">
        {theme.radio && (
          <section className="radio" aria-label="Media sosial">
            <div className="radio-face">
              <span className="knob" data-knob="vol" aria-hidden>
                <span className="knob-cap" />
              </span>
              <div className="vfd" aria-hidden>
                <RadioDisplay name={profile.name} />
              </div>
              <span className="knob" data-knob="tune" aria-hidden>
                <span className="knob-cap" />
              </span>

              <ul className="presets">
                {presets.map((s, i) => {
                  if (!s) {
                    return (
                      <li key={`blank-${i}`} aria-hidden>
                        <span className="preset" data-blank>
                          <span className="pnum">{i + 1}</span>
                        </span>
                      </li>
                    );
                  }
                  const I = ICON[s.kind] ?? Globe;
                  const name = SOCIAL_NAME[s.kind] ?? s.kind;
                  return (
                    <li key={s.id}>
                      <a className="preset" href={s.url} aria-label={name} data-vfd={name} data-slot={`P${i + 1}`}>
                        <span className="pnum" aria-hidden>{i + 1}</span>
                        <I size={18} weight="bold" aria-hidden />
                        <span className="pled" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <span className="foot" data-side="l" aria-hidden />
            <span className="foot" data-side="r" aria-hidden />
          </section>
        )}

        <article className="chest" aria-labelledby="owner">
          <div className="lid">
            <header className="plate">
              <div className="sticker">
                {profile.avatar ? (
                  <ConeAvatar key={profile.avatar} src={profile.avatar} initials={initials(profile.name)} />
                ) : (
                  <span aria-hidden>{initials(profile.name)}</span>
                )}
              </div>
              <div className="plate-text">
                <h1 id="owner" className="dymo" dir="auto">
                  <span>{profile.name}</span>
                </h1>
                {profile.bio && (
                  <p className="tape" dir="auto">
                    {profile.bio}
                  </p>
                )}
              </div>
            </header>
            <span className="lock" aria-hidden />
          </div>

          <div className="cab">
            {links.length > 0 ? (
              <ul className="drawers" aria-label="Link">
                {links.map((l, i) => {
                  const I = ICON[l.icon] ?? LinkSimple;
                  return (
                    <li key={l.id} style={{ "--i": i } as CSSProperties}>
                      <a
                        className="drawer"
                        href={l.url}
                        data-lit={l.lit || undefined}
                        data-vfd={l.label}
                        data-slot={`CH${String(i + 1).padStart(2, "0")}`}
                      >
                        <span className="pull" aria-hidden>
                          <span className="pull-led" />
                        </span>
                        <span className="card">
                          <I className="glyph" size={20} weight="bold" aria-hidden />
                          <span className="label" dir="auto">{l.label}</span>
                          {l.lit && <span className="sr-only"> (utama)</span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="drawers">
                <p className="drawer" data-empty>
                  <span className="pull" aria-hidden />
                  <span className="card">Belum ada link yang ditampilkan.</span>
                </p>
              </div>
            )}
            <span className="side-handle" aria-hidden />
          </div>

          <div className="kick" aria-hidden>
            <span className="caster" data-side="l"><i /></span>
            <span className="caster" data-side="r"><i /></span>
          </div>
        </article>
        <div className="floor" aria-hidden />
      </main>
    </div>
  );
}
