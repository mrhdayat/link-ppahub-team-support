"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowCounterClockwise, CaretDown, Check, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { LABELS, STATUS, WARNA, ZONA, type Kategori, type Link, type Site, type StatusWarna, type Zona } from "@/lib/site";
import {
  Field, NumberInput, Plate, RowTools, Segmented, WARNA_NAME,
  fid, focusLater, initialsOf, insertAt, newId, slugify, swap, uniqueSlug, wire,
} from "./controls";

export type Update = (fn: (s: Site) => Site) => void;
type Props = {
  site: Site;
  update: Update;
  errors: Record<string, string>;
  announce: (message: string) => void;
};

const LINK_MAX = 200;
const KATEGORI_MAX = 12;
const TEKS_MAX = 6;
const UTAMA_MAX = 2;

/* ---------- Profil ---------- */

export function ProfilSection({ site, update, errors }: Props) {
  const { profil } = site;
  const set = (patch: Partial<Site["profil"]>) => update((s) => ({ ...s, profil: { ...s.profil, ...patch } }));
  const e = (k: string) => errors[`profil.${k}`];

  return (
    <section className="panel" aria-labelledby={fid("profil")}>
      <h2 className="plate-h" data-warna="yellow" id={fid("profil")} tabIndex={-1}>Profil</h2>

      <Field path="profil.nama" label="Nama" error={e("nama")}>
        <input {...wire("profil.nama", e("nama"))} value={profil.nama} maxLength={40} autoComplete="off"
          onChange={(ev) => {
            const nama = ev.target.value;
            // Initials follow the name until the admin types their own.
            update((s) => {
              const auto = !s.profil.inisial || s.profil.inisial === initialsOf(s.profil.nama);
              return { ...s, profil: { ...s.profil, nama, inisial: auto ? initialsOf(nama) : s.profil.inisial } };
            });
          }} />
      </Field>

      <Field path="profil.inisial" label="Inisial" error={e("inisial")} hint="2 huruf di rambu wajik">
        <input {...wire("profil.inisial", e("inisial"), true)} className="inisial" value={profil.inisial} maxLength={2}
          autoCapitalize="characters" autoComplete="off" spellCheck={false}
          onChange={(ev) => set({ inisial: ev.target.value.toUpperCase() })} />
      </Field>

      <Field path="profil.bio" label="Bio" error={e("bio")}
        hint={<span aria-live="polite">{profil.bio.length}/140</span>}>
        <textarea {...wire("profil.bio", e("bio"), true)} value={profil.bio} maxLength={140} rows={3}
          onChange={(ev) => set({ bio: ev.target.value })} />
      </Field>
    </section>
  );
}

/* ---------- Status & kontak ---------- */

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const LAMP_NAME: Record<StatusWarna, string> = { hijau: "Hijau", kuning: "Kuning", merah: "Merah" };

export function StatusSection({ site, update, errors, announce }: Props) {
  const { status } = site;
  const setStatus = (patch: Partial<Site["status"]>) => update((s) => ({ ...s, status: { ...s.status, ...patch } }));
  const e = (k: string) => errors[k];
  const teks = site.teksBerjalan;
  const setTeks = (fn: (t: string[]) => string[]) => update((s) => ({ ...s, teksBerjalan: fn(s.teksBerjalan) }));

  return (
    <section className="panel" aria-labelledby={fid("status")}>
      <h2 className="plate-h" data-warna="green" id={fid("status")} tabIndex={-1}>Status &amp; kontak</h2>

      <Segmented name="mode" label="Mode status" id={fid("status.mode")} value={status.mode}
        onChange={(mode) => setStatus({ mode })}
        options={[{ value: "otomatis", label: "Otomatis" }, { value: "manual", label: "Manual" }]} />

      <Segmented name="zona" label="Zona waktu jam buka" id={fid("status.zona")} value={status.zona}
        onChange={(zona) => setStatus({ zona })}
        options={(Object.keys(ZONA) as Zona[]).map((z) => ({ value: z, label: ZONA[z] }))} />

      <div className="pair">
        <Field path="status.jamBuka" label="Jam buka" error={e("status.jamBuka")}>
          <NumberInput {...wire("status.jamBuka", e("status.jamBuka"))} min={0} max={23}
            value={status.jamBuka} onValue={(jamBuka) => setStatus({ jamBuka })} />
        </Field>
        <Field path="status.jamTutup" label="Jam tutup" error={e("status.jamTutup")}>
          <NumberInput {...wire("status.jamTutup", e("status.jamTutup"))} min={1} max={24}
            value={status.jamTutup} onValue={(jamTutup) => setStatus({ jamTutup })} />
        </Field>
      </div>

      <fieldset className="field" data-invalid={e("status.hariLibur") ? "" : undefined}>
        <legend>Hari libur</legend>
        <div className="days">
          {DAYS.map((d, i) => {
            const on = status.hariLibur.includes(i);
            return (
              <button key={d} type="button" className="day" aria-pressed={on} aria-label={DAY_FULL[i]}
                id={i === 0 ? fid("status.hariLibur") : undefined}
                onClick={() => setStatus({
                  hariLibur: on ? status.hariLibur.filter((x) => x !== i) : [...status.hariLibur, i].sort(),
                })}>
                {d}
              </button>
            );
          })}
        </div>
        {e("status.hariLibur") && <p className="field-error">{e("status.hariLibur")}</p>}
      </fieldset>

      <div className="field">
        <Segmented name="manual" label="Status manual" className="lamps" id={fid("status.manual")}
          value={status.manual} disabled={status.mode !== "manual"}
          onChange={(manual) => setStatus({ manual })}
          options={STATUS.map((s) => ({
            value: s,
            label: <><span className="lamp" data-lamp={s} aria-hidden />{LAMP_NAME[s]}</>,
          }))} />
        {status.mode !== "manual" && <p className="field-hint">Aktif di mode manual. Mode otomatis memakai jam dan hari libur.</p>}
      </div>

      <Field path="balasMaksJam" label="Batas balas pesan (jam)" error={e("balasMaksJam")} hint="1–168">
        <NumberInput {...wire("balasMaksJam", e("balasMaksJam"), true)} min={1} max={168}
          value={site.balasMaksJam} onValue={(balasMaksJam) => update((s) => ({ ...s, balasMaksJam }))} />
      </Field>

      <Field path="whatsapp" label="WhatsApp" error={e("whatsapp")}
        hint="https://wa.me/62… tanpa angka 0 di depan">
        <input {...wire("whatsapp", e("whatsapp"), true)} type="url" inputMode="url" autoCapitalize="off"
          spellCheck={false} placeholder="https://wa.me/62812…" value={site.whatsapp}
          onChange={(ev) => update((s) => ({ ...s, whatsapp: ev.target.value.trim() }))} />
      </Field>

      <fieldset className="field" id={fid("teksBerjalan")} tabIndex={-1}>
        <div className="field-head">
          <legend>Teks berjalan</legend>
          <span className="field-hint">{teks.length}/{TEKS_MAX}</span>
        </div>
        <ol className="stack">
          {teks.map((t, i) => {
            const err = e(`teksBerjalan.${i}`);
            return (
              <li key={i} className="list-row">
                <input {...wire(`teksBerjalan.${i}`, err)} aria-label={`Teks ${i + 1}`} value={t} maxLength={60}
                  onChange={(ev) => setTeks((all) => all.map((x, j) => (j === i ? ev.target.value : x)))} />
                <RowTools prefix={`tb-${i}`} name={`teks ${i + 1}`} first={i === 0} last={i === teks.length - 1}
                  onMove={(d) => {
                    setTeks((all) => swap(all, i, i + d));
                    focusLater(`tb-${i + d}-${d < 0 ? "up" : "down"}`, `tb-${i + d}-${d < 0 ? "down" : "up"}`);
                  }}
                  onRemove={() => {
                    setTeks((all) => all.filter((_, j) => j !== i));
                    announce(`Teks ${i + 1} dihapus.`);
                    focusLater(`tb-${i}-del`, `tb-${i - 1}-del`, "tb-add");
                  }} />
                {err && <p className="field-error" id={`${fid(`teksBerjalan.${i}`)}-err`}>{err}</p>}
              </li>
            );
          })}
        </ol>
        <div className="add-row">
          <button type="button" className="btn" id="tb-add" disabled={teks.length >= TEKS_MAX}
            aria-describedby={teks.length >= TEKS_MAX ? "tb-full" : undefined}
            onClick={() => {
              setTeks((all) => [...all, ""]);
              focusLater(fid(`teksBerjalan.${teks.length}`));
            }}>
            <Plus size={18} weight="bold" aria-hidden />
            Tambah teks
          </button>
          {teks.length >= TEKS_MAX && <span className="field-hint" id="tb-full">Maksimal {TEKS_MAX} teks</span>}
        </div>
      </fieldset>
    </section>
  );
}

/* ---------- Kategori ---------- */

/** Point every link at a category's new id. Safe because category ids are kept unique while editing. */
function renameKategori(s: Site, i: number, patch: Partial<Kategori>): Site {
  const from = s.kategori[i]!.id;
  const to = patch.id ?? from;
  return {
    ...s,
    kategori: s.kategori.map((k, j) => (j === i ? { ...k, ...patch } : k)),
    link: from === to ? s.link : s.link.map((l) => (l.kategori === from ? { ...l, kategori: to } : l)),
  };
}

export function KategoriSection({ site, update, errors, announce }: Props) {
  const [moving, setMoving] = useState<{ id: string; to: string } | null>(null);
  const [clash, setClash] = useState<number | null>(null);
  const [removed, setRemoved] = useState<{ k: Kategori; i: number } | null>(null);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of site.link) c[l.kategori] = (c[l.kategori] ?? 0) + 1;
    return c;
  }, [site.link]);
  const full = site.kategori.length >= KATEGORI_MAX;

  function remove(i: number) {
    const k = site.kategori[i]!;
    if (counts[k.id]) {
      const other = site.kategori.find((x) => x.id !== k.id);
      setMoving({ id: k.id, to: other?.id ?? "" });
      focusLater("kat-move-to", "kat-move-cancel");
      return;
    }
    update((s) => ({ ...s, kategori: s.kategori.filter((x) => x.id !== k.id) }));
    setRemoved({ k, i });
    setMoving(null);
    announce(`Kategori ${k.nama} dihapus.`);
    focusLater("kat-undo");
  }

  function moveAndRemove() {
    if (!moving?.to) return;
    const { id, to } = moving;
    const i = site.kategori.findIndex((k) => k.id === id);
    const k = site.kategori[i]!;
    update((s) => ({
      ...s,
      link: s.link.map((l) => (l.kategori === id ? { ...l, kategori: to } : l)),
      kategori: s.kategori.filter((x) => x.id !== id),
    }));
    setMoving(null);
    setRemoved({ k, i });
    announce(`${counts[id]} tautan dipindahkan, kategori ${k.nama} dihapus.`);
    focusLater("kat-undo");
  }

  function undo() {
    if (!removed) return;
    update((s) => {
      const taken = s.kategori.map((k) => k.id);
      const k = { ...removed.k, id: uniqueSlug(removed.k.id, taken) };
      return { ...s, kategori: insertAt(s.kategori, Math.min(removed.i, s.kategori.length), k) };
    });
    announce(`Kategori ${removed.k.nama} dikembalikan.`);
    setRemoved(null);
  }

  const undoRow = removed && (
    <li className="undo-row" key="undo">
      <span>Kategori <b>{removed.k.nama}</b> dihapus.</span>
      <button type="button" className="btn" id="kat-undo" onClick={undo}>
        <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
        Urungkan
      </button>
      <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => setRemoved(null)}>
        <X size={18} weight="bold" aria-hidden />
      </button>
    </li>
  );

  return (
    <section className="panel" aria-labelledby={fid("kategori")}>
      <h2 className="plate-h" data-warna="blue" id={fid("kategori")} tabIndex={-1}>Kategori</h2>
      {errors["kategori"] && <p className="field-error">{errors["kategori"]}</p>}

      <ol className="stack">
        {site.kategori.map((k, i) => {
          const p = `kategori.${i}`;
          const others = site.kategori.filter((_, j) => j !== i).map((x) => x.id);
          const n = counts[k.id] ?? 0;
          const idErr = clash === i ? "ID ini sudah dipakai kategori lain" : errors[`${p}.id`];
          return [
            removed?.i === i ? undoRow : null,
            <li key={`k-${i}`} className="card">
              <div className="card-top">
                <div className="card-name">
                  <Plate warna={k.warna}>{k.nama || "Tanpa nama"}</Plate>
                  <span className="count">{n} tautan</span>
                </div>
                <RowTools prefix={`kat-${i}`} name={`kategori ${k.nama}`} first={i === 0} last={i === site.kategori.length - 1}
                  onMove={(d) => {
                    update((s) => ({ ...s, kategori: swap(s.kategori, i, i + d) }));
                    focusLater(`kat-${i + d}-${d < 0 ? "up" : "down"}`, `kat-${i + d}-${d < 0 ? "down" : "up"}`);
                  }}
                  onRemove={() => remove(i)} />
              </div>

              {moving?.id === k.id && (
                <div className="notice" role="group" aria-labelledby="kat-move-msg">
                  <p id="kat-move-msg">
                    {n} tautan masih memakai kategori ini.{" "}
                    {others.length ? "Pindahkan ke kategori lain lalu hapus?" : "Buat kategori lain atau hapus tautannya dulu."}
                  </p>
                  {others.length > 0 && (
                    <select id="kat-move-to" aria-label="Pindahkan ke" value={moving.to}
                      onChange={(ev) => setMoving({ id: k.id, to: ev.target.value })}>
                      {site.kategori.filter((x) => x.id !== k.id).map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                    </select>
                  )}
                  <div className="notice-actions">
                    {others.length > 0 && (
                      <button type="button" className="btn" data-danger onClick={moveAndRemove}>Pindahkan &amp; hapus</button>
                    )}
                    <button type="button" className="btn" id="kat-move-cancel"
                      onClick={() => { setMoving(null); focusLater(`kat-${i}-del`); }}>Batal</button>
                  </div>
                </div>
              )}

              <Field path={`${p}.nama`} label="Nama" error={errors[`${p}.nama`]}>
                <input {...wire(`${p}.nama`, errors[`${p}.nama`])} value={k.nama} maxLength={24} autoComplete="off"
                  onChange={(ev) => {
                    const nama = ev.target.value;
                    // The id follows the name until the admin edits the id by hand.
                    update((s) => {
                      const cur = s.kategori[i]!;
                      const taken = s.kategori.filter((_, j) => j !== i).map((x) => x.id);
                      const auto = cur.id === uniqueSlug(slugify(cur.nama), taken);
                      return renameKategori(s, i, { nama, ...(auto && { id: uniqueSlug(slugify(nama), taken) }) });
                    });
                  }} />
              </Field>

              <Field path={`${p}.id`} label="ID" error={idErr} hint={`#jalur-${k.id}`}>
                <input {...wire(`${p}.id`, idErr, true)} value={k.id} maxLength={24} autoCapitalize="off"
                  autoComplete="off" spellCheck={false}
                  onChange={(ev) => {
                    const id = ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
                    // Refuse a duplicate id: links are re-pointed by id, so two equal ids would merge their links.
                    if (others.includes(id)) return setClash(i);
                    setClash(null);
                    update((s) => renameKategori(s, i, { id }));
                  }} />
              </Field>

              <fieldset className="field">
                <legend>Warna</legend>
                <div className="swatches">
                  {WARNA.map((w) => (
                    <label key={w} className="swatch">
                      <input type="radio" name={`warna-${i}`} value={w} checked={k.warna === w}
                        onChange={() => update((s) => renameKategori(s, i, { warna: w }))} />
                      <Plate warna={w}>
                        {k.warna === w && <Check size={20} weight="bold" aria-hidden />}
                        <span className="sr-only">{WARNA_NAME[w]}</span>
                      </Plate>
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>,
          ];
        })}
        {removed && removed.i >= site.kategori.length ? undoRow : null}
      </ol>

      <div className="add-row">
        <button type="button" className="btn" disabled={full} aria-describedby={full ? "kat-full" : undefined}
          onClick={() => {
            const taken = site.kategori.map((k) => k.id);
            const used = new Set(site.kategori.map((k) => k.warna));
            const k: Kategori = {
              id: uniqueSlug("jalur-baru", taken),
              nama: "Jalur baru",
              warna: WARNA.find((w) => !used.has(w)) ?? "green",
            };
            update((s) => ({ ...s, kategori: [...s.kategori, k] }));
            focusLater(fid(`kategori.${site.kategori.length}.nama`));
          }}>
          <Plus size={18} weight="bold" aria-hidden />
          Tambah kategori
        </button>
        {full && <span className="field-hint" id="kat-full">Maksimal {KATEGORI_MAX} kategori</span>}
      </div>
    </section>
  );
}

/* ---------- Tautan ---------- */

export type LinkView = { q: string; kat: string };
type LinksProps = Props & {
  view: LinkView;
  setView: Dispatch<SetStateAction<LinkView>>;
  open: ReadonlySet<string>;
  setOpen: (id: string, open: boolean) => void;
};

const LABEL_NAME: Record<(typeof LABELS)[number], string> = { baru: "Baru", populer: "Populer", promo: "Promo" };

export function LinksSection({ site, update, errors, announce, view, setView, open, setOpen }: LinksProps) {
  const [removed, setRemoved] = useState<{ link: Link; i: number } | null>(null);
  const katOf = useMemo(() => new Map(site.kategori.map((k) => [k.id, k])), [site.kategori]);
  const q = view.q.trim().toLowerCase();
  const visible = site.link
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => (!view.kat || l.kategori === view.kat)
      && (!q || `${l.judul} ${l.url} ${l.catatan}`.toLowerCase().includes(q)));
  const utamaCount = site.link.filter((l) => l.utama).length;
  const addTo = view.kat || site.kategori[0]?.id;
  const full = site.link.length >= LINK_MAX;
  const errorRows = new Set(Object.keys(errors).map((k) => /^link\.(\d+)\./.exec(k)?.[1]).filter(Boolean).map(Number));

  const setLink = (i: number, patch: Partial<Link>) =>
    update((s) => ({ ...s, link: s.link.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  function add() {
    if (!addTo) return;
    const link: Link = { id: newId(), judul: "", url: "https://", kategori: addTo, catatan: "", utama: false };
    update((s) => ({ ...s, link: [...s.link, link] }));
    setView((v) => ({ ...v, q: "" }));
    setOpen(link.id, true);
    focusLater(fid(`link.${site.link.length}.judul`));
  }

  function remove(i: number) {
    const link = site.link[i]!;
    update((s) => ({ ...s, link: s.link.filter((l) => l.id !== link.id) }));
    setRemoved({ link, i });
    announce(`Tautan ${link.judul || "tanpa judul"} dihapus.`);
    focusLater("lk-undo");
  }

  function undo() {
    if (!removed) return;
    update((s) => {
      const link = { ...removed.link, utama: removed.link.utama && s.link.filter((l) => l.utama).length < UTAMA_MAX };
      return { ...s, link: insertAt(s.link, Math.min(removed.i, s.link.length), link) };
    });
    announce(`Tautan ${removed.link.judul || "tanpa judul"} dikembalikan.`);
    setRemoved(null);
  }

  const undoRow = removed && (
    <li className="undo-row" key="undo">
      <span><b>{removed.link.judul || "Tautan tanpa judul"}</b> dihapus.</span>
      <button type="button" className="btn" id="lk-undo" onClick={undo}>
        <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
        Urungkan
      </button>
      <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => setRemoved(null)}>
        <X size={18} weight="bold" aria-hidden />
      </button>
    </li>
  );
  // The undo strip sits where the link was: before the first visible link that came after it.
  const undoAt = removed ? visible.findIndex(({ i }) => i >= removed.i) : -1;

  return (
    <section className="panel" aria-labelledby={fid("link")}>
      <h2 className="plate-h" data-warna="red" id={fid("link")} tabIndex={-1}>Tautan</h2>
      {errors["link"] && <p className="field-error">{errors["link"]}</p>}

      <div className="link-tools">
        <div className="search">
          <MagnifyingGlass size={20} weight="bold" aria-hidden />
          <input type="search" aria-label="Cari tautan" placeholder="Cari judul, alamat, catatan" value={view.q}
            onChange={(ev) => setView((v) => ({ ...v, q: ev.target.value }))} />
        </div>
        <select aria-label="Saring kategori" value={view.kat} onChange={(ev) => setView((v) => ({ ...v, kat: ev.target.value }))}>
          <option value="">Semua kategori ({site.link.length})</option>
          {site.kategori.map((k) => (
            <option key={k.id} value={k.id}>{k.nama} ({site.link.filter((l) => l.kategori === k.id).length})</option>
          ))}
        </select>
        <div className="add-row">
          <button type="button" className="btn" disabled={!addTo || full} onClick={add}
            aria-describedby={!addTo || full ? "lk-full" : undefined}>
            <Plus size={18} weight="bold" aria-hidden />
            Tambah tautan{addTo && view.kat ? ` ke ${katOf.get(addTo)?.nama}` : ""}
          </button>
          {(!addTo || full) && (
            <span className="field-hint" id="lk-full">{full ? `Maksimal ${LINK_MAX} tautan` : "Buat kategori dulu"}</span>
          )}
        </div>
        <p className="field-hint" aria-live="polite">
          {visible.length} dari {site.link.length} tautan · {utamaCount}/{UTAMA_MAX} utama
        </p>
      </div>

      <ul className="stack">
        {visible.map(({ l, i }, pos) => {
          const p = `link.${i}`;
          const e = (k: string) => errors[`${p}.${k}`];
          const k = katOf.get(l.kategori);
          const isOpen = open.has(l.id);
          const utamaBlocked = !l.utama && utamaCount >= UTAMA_MAX;
          return [
            pos === undoAt ? undoRow : null,
            <li key={l.id} className="link-row">
              <details open={isOpen} onToggle={(ev) => setOpen(l.id, ev.currentTarget.open)}>
                <summary>
                  <Plate warna={k?.warna}><span className="sr-only">{k?.nama ?? "Tanpa kategori"}</span></Plate>
                  <span className="sum-judul">{l.judul || "Tanpa judul"}</span>
                  {l.utama && <span className="tag">Utama</span>}
                  {l.label && <span className="tag">{LABEL_NAME[l.label]}</span>}
                  {errorRows.has(i) && <span className="tag" data-error>Perbaiki</span>}
                  <CaretDown className="caret" size={18} weight="bold" aria-hidden />
                </summary>

                {isOpen && (
                  <div className="link-body">
                    <Field path={`${p}.judul`} label="Judul" error={e("judul")}>
                      <input {...wire(`${p}.judul`, e("judul"))} value={l.judul} maxLength={48} autoComplete="off"
                        onChange={(ev) => setLink(i, { judul: ev.target.value })} />
                    </Field>
                    <Field path={`${p}.url`} label="Alamat" error={e("url")}>
                      <input {...wire(`${p}.url`, e("url"))} type="url" inputMode="url" autoCapitalize="off"
                        spellCheck={false} value={l.url} onChange={(ev) => setLink(i, { url: ev.target.value.trim() })} />
                    </Field>
                    <Field path={`${p}.kategori`} label="Kategori" error={e("kategori")}>
                      <select {...wire(`${p}.kategori`, e("kategori"))} value={l.kategori}
                        onChange={(ev) => setLink(i, { kategori: ev.target.value })}>
                        {!k && <option value={l.kategori}>Pilih kategori</option>}
                        {site.kategori.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                      </select>
                    </Field>
                    <Field path={`${p}.catatan`} label="Catatan" error={e("catatan")}
                      hint={`${l.catatan.length}/60`}>
                      <input {...wire(`${p}.catatan`, e("catatan"), true)} value={l.catatan} maxLength={60}
                        autoComplete="off" onChange={(ev) => setLink(i, { catatan: ev.target.value })} />
                    </Field>

                    <div className="field">
                      <label className="switch">
                        <input type="checkbox" role="switch" id={fid(`${p}.utama`)} checked={l.utama}
                          disabled={utamaBlocked} aria-describedby={utamaBlocked ? `${fid(`${p}.utama`)}-hint` : undefined}
                          onChange={(ev) => setLink(i, { utama: ev.target.checked })} />
                        <span>Tautan utama (papan gantry)</span>
                      </label>
                      {utamaBlocked && <p className="field-hint" id={`${fid(`${p}.utama`)}-hint`}>Maksimal 2 tautan utama</p>}
                    </div>

                    <div className="pair">
                      <Field path={`${p}.label`} label="Label" error={e("label")}>
                        <select {...wire(`${p}.label`, e("label"))} value={l.label ?? ""}
                          onChange={(ev) => {
                            const label = (ev.target.value || undefined) as Link["label"];
                            setLink(i, label ? { label } : { label: undefined, labelSampai: undefined });
                          }}>
                          <option value="">Tanpa label</option>
                          {LABELS.map((x) => <option key={x} value={x}>{LABEL_NAME[x]}</option>)}
                        </select>
                      </Field>
                      <Field path={`${p}.labelSampai`} label="Label sampai" error={e("labelSampai")}>
                        <input {...wire(`${p}.labelSampai`, e("labelSampai"))} type="date" disabled={!l.label}
                          value={l.labelSampai ?? ""} onChange={(ev) => setLink(i, { labelSampai: ev.target.value || undefined })} />
                      </Field>
                    </div>

                    <div className="row-foot">
                      <span className="field-hint">Urutan di jalur</span>
                      <RowTools prefix={`lk-${l.id}`} name={`tautan ${l.judul || "tanpa judul"}`}
                        first={pos === 0} last={pos === visible.length - 1}
                        onMove={(d) => {
                          const j = visible[pos + d]!.i;
                          update((s) => ({ ...s, link: swap(s.link, i, j) }));
                          focusLater(`lk-${l.id}-${d < 0 ? "up" : "down"}`, `lk-${l.id}-${d < 0 ? "down" : "up"}`);
                        }}
                        onRemove={() => remove(i)} />
                    </div>
                  </div>
                )}
              </details>
            </li>,
          ];
        })}
        {removed && undoAt === -1 ? undoRow : null}
      </ul>
      {visible.length === 0 && site.link.length > 0 && (
        <p className="field-hint">Tidak ada tautan yang cocok. Ubah pencarian atau pilih semua kategori.</p>
      )}
    </section>
  );
}
