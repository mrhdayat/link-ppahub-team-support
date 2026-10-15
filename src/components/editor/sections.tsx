"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import { FONTS, ICONS, HANDLES, PRESETS, SCENES, SOCIALS, TRIMS, type Site, type Theme } from "@/lib/site";
import { ICON, SOCIAL_NAME } from "@/components/faceplate";
import { Fader, Field, Segmented, Swatch, Switch, fid, wire } from "./controls";

export type Update = (fn: (s: Site) => Site) => void;
type Props = {
  site: Site;
  update: Update;
  errors: Record<string, string>;
  onRemoved: (message: string, restore: (s: Site) => Site) => void;
  announce: (message: string) => void;
};

const ICON_NAME: Record<(typeof ICONS)[number], string> = {
  link: "Link", globe: "Website", whatsapp: "WhatsApp", instagram: "Instagram", tiktok: "TikTok",
  youtube: "YouTube", linkedin: "LinkedIn", x: "X", facebook: "Facebook", email: "Email", phone: "Telepon",
  map: "Peta", file: "Dokumen", calendar: "Kalender", briefcase: "Kerja", shop: "Toko", music: "Musik", camera: "Kamera",
};

// Display glows: the five preset glows plus a red and a plain white.
const LEDS = [
  { label: "Toska", color: "#5ef2c8" }, { label: "Jingga", color: "#ffb547" }, { label: "Biru es", color: "#8fe3ff" },
  { label: "Hijau", color: "#a6ff7a" }, { label: "Oranye", color: "#ff8a3d" }, { label: "Merah", color: "#ff5a4e" },
  { label: "Putih", color: "#f2f4f7" },
];
const HANDLE_NAME: Record<(typeof HANDLES)[number], string> = { bar: "Batang", cup: "Mangkuk", tab: "Lidah" };
const SCENE_NAME: Record<(typeof SCENES)[number], string> = { garasi: "Garasi", malam: "Malam", polos: "Polos" };
const TRIM_NAME: Record<(typeof TRIMS)[number], string> = { krom: "Krom", hitam: "Hitam" };

/** Tiny drawings of each drawer pull, so the choice is visible before it's made. */
const PULL: Record<(typeof HANDLES)[number], ReactNode> = {
  bar: <><rect x="1" y="4" width="26" height="5" rx="2.5" /><rect x="4" y="8" width="3" height="5" /><rect x="21" y="8" width="3" height="5" /></>,
  cup: <path d="M3 3h22v3a11 8 0 0 1-22 0z" />,
  tab: <><rect x="1" y="11" width="26" height="2" /><rect x="8" y="3" width="12" height="9" rx="2" /></>,
};
const SOCIAL_MAX = 6;
const FONT_NAME: Record<(typeof FONTS)[number], string> = { barlow: "Barlow", shoulders: "Shoulders", archivo: "Archivo" };

const newId = () => Math.random().toString(36).slice(2, 10);
const focusLater = (...ids: string[]) =>
  requestAnimationFrame(() => {
    for (const id of ids) {
      const el = document.getElementById(id) as HTMLButtonElement | null;
      if (el && !el.disabled) return el.focus();
    }
  });

function swap<T>(arr: T[], i: number, j: number): T[] {
  const a = [...arr];
  [a[i], a[j]] = [a[j]!, a[i]!];
  return a;
}
function insertAt<T>(arr: T[], i: number, item: T): T[] {
  return [...arr.slice(0, i), item, ...arr.slice(i)];
}

/* ---------- Profil ---------- */

const AVATAR = 256;
const AVATAR_MAX = 200_000; // matches the schema's cap on the inline data URL

/** Center-crop to a square, scale to 256 px, encode WebP (JPEG where the browser can't encode WebP). */
async function toAvatar(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR, AVATAR);
  img.close();
  const webp = canvas.toDataURL("image/webp", 0.85);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileSection({ site, update, errors }: Props) {
  const { profile } = site;
  const [uploadError, setUploadError] = useState("");
  const setProfile = (patch: Partial<Site["profile"]>) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  const inline = profile.avatar.startsWith("data:");
  const avatarError = uploadError || errors["profile.avatar"];

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    try {
      const data = await toAvatar(file);
      if (data.length > AVATAR_MAX) return setUploadError("Foto masih lebih dari 200 KB setelah dikecilkan. Pilih foto lain.");
      setProfile({ avatar: data });
    } catch {
      setUploadError("Foto tidak bisa dibaca. Pakai file JPG, PNG, atau WebP.");
    }
  }

  return (
    <section className="panel" aria-labelledby="h-profil">
      <h2 className="tape" id="h-profil">Profil</h2>

      <Field path="profile.name" label="Nama" error={errors["profile.name"]}>
        <input {...wire("profile.name", errors["profile.name"])} value={profile.name} maxLength={60} autoComplete="off"
          onChange={(e) => setProfile({ name: e.target.value })} />
      </Field>

      <Field path="profile.bio" label="Bio" error={errors["profile.bio"]}
        hint={<span className="count" aria-live="polite">{profile.bio.length}/160</span>}>
        <textarea {...wire("profile.bio", errors["profile.bio"])} value={profile.bio} maxLength={160} rows={3}
          onChange={(e) => setProfile({ bio: e.target.value })} />
      </Field>

      <div className="avatar-row">
        <span className="avatar-cone" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL or inline data image */}
          {profile.avatar ? <img src={profile.avatar} alt="" width={64} height={64} /> : <span>Foto</span>}
        </span>
        <div className="avatar-actions">
          <label className="btn">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/*" className="sr-only" onChange={onFile} />
            <UploadSimple size={18} weight="bold" aria-hidden />
            Unggah foto
          </label>
          <button type="button" className="btn" disabled={!profile.avatar}
            onClick={() => { setUploadError(""); setProfile({ avatar: "" }); }}>
            <Trash size={18} weight="bold" aria-hidden />
            Hapus foto
          </button>
        </div>
      </div>

      <Field path="profile.avatar" label="Alamat gambar foto" error={avatarError}
        hint={inline ? "Memakai foto unggahan" : "Atau unggah foto di atas"}>
        <input {...wire("profile.avatar", avatarError)} type="url" inputMode="url" autoCapitalize="off" spellCheck={false}
          placeholder={inline ? "Ketik alamat untuk mengganti foto unggahan" : "https://"}
          value={inline ? "" : profile.avatar}
          onChange={(e) => { setUploadError(""); setProfile({ avatar: e.target.value.trim() }); }} />
      </Field>
    </section>
  );
}

/* ---------- Link & Sosial: shared row tools ---------- */

function RowTools({ kind, id, name, i, count, onMove, onRemove }: {
  kind: "links" | "socials"; id: string; name: string; i: number; count: number;
  onMove: (d: -1 | 1) => void; onRemove: () => void;
}) {
  return (
    <div className="row-tools">
      <button type="button" className="icon-btn" id={`${kind}-${id}-up`} disabled={i === 0}
        aria-label={`Naikkan ${name}`} onClick={() => onMove(-1)}>
        <ArrowUp size={18} weight="bold" aria-hidden />
      </button>
      <button type="button" className="icon-btn" id={`${kind}-${id}-down`} disabled={i === count - 1}
        aria-label={`Turunkan ${name}`} onClick={() => onMove(1)}>
        <ArrowDown size={18} weight="bold" aria-hidden />
      </button>
      <button type="button" className="icon-btn" data-danger id={`${kind}-${id}-del`}
        aria-label={`Hapus ${name}`} onClick={onRemove}>
        <Trash size={18} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

/** Reorder and delete for either list, with focus kept on the control the admin just used. */
function listOps<K extends "links" | "socials">(kind: K, { site, update, onRemoved, announce }: Props, noun: string) {
  const list = site[kind];
  return {
    move(i: number, d: -1 | 1) {
      const id = list[i]!.id;
      update((s) => ({ ...s, [kind]: swap(s[kind] as { id: string }[], i, i + d) }) as Site);
      announce(`Dipindah ke posisi ${i + d + 1} dari ${list.length}.`);
      const dir = d < 0 ? "up" : "down";
      focusLater(`${kind}-${id}-${dir}`, `${kind}-${id}-${dir === "up" ? "down" : "up"}`);
    },
    remove(i: number, name: string) {
      const item = list[i]!;
      update((s) => ({ ...s, [kind]: s[kind].filter((x) => x.id !== item.id) }));
      onRemoved(`${noun} ${name} dihapus.`, (s) =>
        ({ ...s, [kind]: insertAt(s[kind] as { id: string }[], Math.min(i, s[kind].length), item) }) as Site);
      const next = list[i + 1] ?? list[i - 1];
      focusLater(next ? `${kind}-${next.id}-del` : fid(kind));
    },
  };
}

/* ---------- Link ---------- */

export function LinksSection(props: Props) {
  const { site, update, errors } = props;
  const ops = listOps("links", props, "Link");
  const setLink = (i: number, patch: Partial<Site["links"][number]>) =>
    update((s) => ({ ...s, links: s.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  function add() {
    const id = newId();
    update((s) => ({ ...s, links: [...s.links, { id, label: "", url: "https://", icon: "link", on: true, lit: false }] }));
    focusLater(fid(`links.${site.links.length}.label`));
  }

  return (
    <section className="panel" aria-labelledby="h-link">
      <h2 className="tape" id="h-link">Link</h2>
      {site.links.length === 0 && <p className="muted">Belum ada link. Tambahkan link pertama.</p>}
      <ol className="rows">
        {site.links.map((l, i) => {
          const p = `links.${i}`;
          const name = l.label.trim() ? `link “${l.label.trim()}”` : "link tanpa nama";
          const I = ICON[l.icon];
          return (
            <li key={l.id}>
              <fieldset className="row" data-hidden={l.on ? undefined : ""}>
                <legend className="sr-only">{name}</legend>
                <Field path={`${p}.label`} label="Nama tombol" error={errors[`${p}.label`]}>
                  <input {...wire(`${p}.label`, errors[`${p}.label`])} value={l.label} maxLength={60} autoComplete="off"
                    onChange={(e) => setLink(i, { label: e.target.value })} />
                </Field>
                <Field path={`${p}.url`} label="Alamat link" error={errors[`${p}.url`]}>
                  <input {...wire(`${p}.url`, errors[`${p}.url`])} type="url" inputMode="url" autoCapitalize="off"
                    spellCheck={false} value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} />
                </Field>
                <div className="row-split">
                  <Field path={`${p}.icon`} label="Ikon">
                    <div className="select">
                      {I && <I size={20} aria-hidden />}
                      <select {...wire(`${p}.icon`)} value={l.icon}
                        onChange={(e) => setLink(i, { icon: e.target.value as typeof l.icon })}>
                        {ICONS.map((k) => <option key={k} value={k}>{ICON_NAME[k]}</option>)}
                      </select>
                    </div>
                  </Field>
                  <div className="row-switches">
                    <Switch label="Tampil" checked={l.on} onChange={(on) => setLink(i, { on })} />
                    <Switch label="Lampu menyala" checked={l.lit} onChange={(lit) => setLink(i, { lit })} />
                  </div>
                </div>
                <RowTools kind="links" id={l.id} name={name} i={i} count={site.links.length}
                  onMove={(d) => ops.move(i, d)} onRemove={() => ops.remove(i, name.replace(/^link /, ""))} />
              </fieldset>
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn add" id={fid("links")} disabled={site.links.length >= 40} onClick={add}>
        <Plus size={18} weight="bold" aria-hidden />
        {site.links.length >= 40 ? "Batas 40 link tercapai" : "Tambah link"}
      </button>
    </section>
  );
}

/* ---------- Sosial ---------- */

export function SocialsSection(props: Props) {
  const { site, update, errors } = props;
  const ops = listOps("socials", props, "Sosial");
  const setSocial = (i: number, patch: Partial<Site["socials"][number]>) =>
    update((s) => ({ ...s, socials: s.socials.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  function add() {
    const used = new Set(site.socials.map((s) => s.kind));
    const kind = SOCIALS.find((k) => !used.has(k)) ?? "globe";
    update((s) => ({ ...s, socials: [...s.socials, { id: newId(), kind, url: kind === "email" ? "mailto:" : "https://" }] }));
    focusLater(fid(`socials.${site.socials.length}.url`));
  }

  return (
    <section className="panel" aria-labelledby="h-sosial">
      <h2 className="tape" id="h-sosial">Sosial</h2>
      <p className="muted">
        Tombol preset 1–6 di radio. {site.socials.length} dari {SOCIAL_MAX} terpakai.
      </p>
      <ol className="rows">
        {site.socials.map((s, i) => {
          const p = `socials.${i}`;
          const name = SOCIAL_NAME[s.kind] ?? s.kind;
          const I = ICON[s.kind];
          return (
            <li key={s.id}>
              <fieldset className="row">
                <legend className="sr-only">Tombol preset {i + 1}: {name}</legend>
                <span className="preset-no" aria-hidden>{i + 1}</span>
                <Field path={`${p}.kind`} label="Jenis">
                  <div className="select">
                    {I && <I size={20} aria-hidden />}
                    <select {...wire(`${p}.kind`)} value={s.kind}
                      onChange={(e) => setSocial(i, { kind: e.target.value as typeof s.kind })}>
                      {SOCIALS.map((k) => <option key={k} value={k}>{SOCIAL_NAME[k] ?? k}</option>)}
                    </select>
                  </div>
                </Field>
                <Field path={`${p}.url`} label="Alamat akun" error={errors[`${p}.url`]}>
                  <input {...wire(`${p}.url`, errors[`${p}.url`])} type="url" inputMode="url" autoCapitalize="off"
                    spellCheck={false} value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} />
                </Field>
                <RowTools kind="socials" id={s.id} name={name} i={i} count={site.socials.length}
                  onMove={(d) => ops.move(i, d)} onRemove={() => ops.remove(i, name)} />
              </fieldset>
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn add" id={fid("socials")} disabled={site.socials.length >= SOCIAL_MAX} onClick={add}>
        <Plus size={18} weight="bold" aria-hidden />
        {site.socials.length >= SOCIAL_MAX ? "Keenam tombol preset sudah terpakai" : "Tambah akun sosial"}
      </button>
    </section>
  );
}

/* ---------- Tampilan ---------- */

export function LookSection({ site, update }: Props) {
  const t = site.theme;
  const setTheme = (patch: Partial<Theme>) => update((s) => ({ ...s, theme: { ...s.theme, ...patch } }));
  const custom = !(t.preset in PRESETS);
  const led = t.led.toLowerCase();

  return (
    <section className="panel" aria-labelledby="h-tampilan">
      <h2 className="tape" id="h-tampilan">Tampilan</h2>

      <fieldset className="group">
        <legend>Cat lemari</legend>
        <div className="swatches chips">
          {Object.entries(PRESETS).map(([key, p]) => (
            <Swatch key={key} name="preset" label={p.label} color={p.base} checked={t.preset === key}
              onSelect={() => setTheme({ preset: key, base: p.base, led: p.led })} />
          ))}
          <Swatch name="preset" label="Kustom" color={t.base} checked={custom}
            onSelect={() => setTheme({ preset: "custom" })} />
        </div>
        <label className="color-pick">
          <input id={fid("theme.base")} type="color" value={t.base}
            onChange={(e) => setTheme({ preset: "custom", base: e.target.value })} />
          <span>Campur cat sendiri</span>
        </label>
      </fieldset>

      <fieldset className="group">
        <legend>Nyala layar</legend>
        <div className="swatches glass">
          {LEDS.map((c) => (
            <Swatch key={c.color} kind="dot" name="led" label={c.label} color={c.color} checked={led === c.color}
              onSelect={() => setTheme({ led: c.color })} />
          ))}
        </div>
        <label className="color-pick">
          <input id={fid("theme.led")} type="color" value={t.led} onChange={(e) => setTheme({ led: e.target.value })} />
          <span>Warna nyala lain</span>
        </label>
      </fieldset>

      <Segmented name="handle" label="Pegangan laci" value={t.handle}
        options={HANDLES.map((k) => ({
          value: k,
          label: <><svg className="pull" viewBox="0 0 28 16" width="28" height="16" aria-hidden>{PULL[k]}</svg>{HANDLE_NAME[k]}</>,
        }))}
        onChange={(handle) => setTheme({ handle })} />
      <Segmented name="scene" label="Latar" value={t.scene}
        options={SCENES.map((k) => ({ value: k, label: SCENE_NAME[k] }))}
        onChange={(scene) => setTheme({ scene })} />
      <Segmented name="trim" label="Logam" value={t.trim}
        options={TRIMS.map((k) => ({ value: k, label: TRIM_NAME[k] }))}
        onChange={(trim) => setTheme({ trim })} />
      <Segmented name="font" label="Huruf" value={t.font}
        options={FONTS.map((f) => ({ value: f, label: FONT_NAME[f], style: { fontFamily: `var(--font-${f})` } }))}
        onChange={(font) => setTheme({ font })} />

      <Fader id={fid("theme.radius")} label="Radius sudut" value={t.radius} min={0} max={28}
        format={(v) => `${v} px`} onChange={(radius) => setTheme({ radius })} />
      <Fader id={fid("theme.depth")} label="Kedalaman bayangan" value={Math.round(t.depth * 100)} min={0} max={100} step={5}
        format={(v) => `${v}%`} onChange={(v) => setTheme({ depth: v / 100 })} />

      <Switch id={fid("theme.radio")} label="Radio di atas lemari" checked={t.radio} onChange={(radio) => setTheme({ radio })} />
    </section>
  );
}
