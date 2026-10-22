"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import { ArrowCounterClockwise, Crosshair, FloppyDisk, MapPin, Plus, X } from "@phosphor-icons/react";
import {
  STATUS, SUMBER_CUACA, TEMA, ZONA, buka24, clockIn, safetyTalkFor, siteSchema, temaFor, type Site, type StatusWarna, type Tema, type Zona,
} from "@/lib/site";
import { Field, NumberInput, RowTools, Segmented, fid, focusLater, initialsOf, shiftIssues, swap, wire } from "./controls";
import { toast } from "./toast";
import type { Commit } from "./dashboard";
import { wilayah, type Wilayah } from "@/app/admin/actions";
import "./forms.css";

export const PROFIL_KEYS = ["profil", "status", "balasMaksJam", "whatsapp", "teksBerjalan", "safetyTalk", "shift", "cuaca", "tema"] as const;
export type ProfilFields = Pick<Site, (typeof PROFIL_KEYS)[number]>;
const pick = (s: Site): ProfilFields =>
  Object.fromEntries(PROFIL_KEYS.map((k) => [k, s[k]])) as ProfilFields;

type Update = (fn: (s: Site) => Site) => void;
type Props = {
  site: Site;
  update: Update;
  errors: Record<string, string>;
  announce: (message: string) => void;
  today: string;
};

const TEKS_MAX = 6;
const TALK_MAX = 60;
const SHIFT_MAX = 4;

/** Focus the field a validation path names, falling back to its nearest parent that has one. */
function focusPath(path: string) {
  const parts = path.split(".");
  for (let n = parts.length; n > 0; n--) {
    const el = document.getElementById(fid(parts.slice(0, n).join(".")));
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center" });
      return;
    }
  }
}

/**
 * Profil & status edit several fields at once, so they keep a draft (held by the dashboard, so switching
 * sections never loses it) and save with one "Simpan perubahan". Only these fields are written back.
 */
export function ProfilTab({ site, edits, setEdits, dirty, commit }: {
  site: Site; edits: ProfilFields | null; setEdits: Dispatch<SetStateAction<ProfilFields | null>>;
  dirty: boolean; commit: Commit;
}) {
  const draft: Site = useMemo(() => ({ ...site, ...(edits ?? {}) }), [site, edits]);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState("");
  const check = useMemo(() => siteSchema.safeParse(draft), [draft]);
  const issues = useMemo(
    () => [...(check.success ? [] : check.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))), ...shiftIssues(draft.shift)],
    [check, draft.shift],
  );
  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    if (attempted) for (const i of issues) out[i.path] ??= i.message;
    return out;
  }, [attempted, issues]);
  const count = Object.keys(errors).length;

  const update: Update = (fn) => setEdits((prev) => pick(fn({ ...site, ...(prev ?? {}) })));

  async function onSave() {
    flushSync(() => setAttempted(true));
    if (!check.success || issues.length) return focusPath(issues[0]!.path);
    const value = { ...pick(check.data), shift: [...check.data.shift].sort() };
    setPending(true);
    const r = await commit((s) => ({ ...s, ...value }), { form: true, done: "Profil & status disimpan" });
    setPending(false);
    if (r.ok) {
      setEdits(null);
      setAttempted(false);
    } else if (r.path) focusPath(r.path);
  }

  const props = { site: draft, update, errors, announce: setLive, today: clockIn(draft.status.zona, new Date()).date };
  return (
    <div className="sec">
      <div className="sec-head">
        <h2 className="plate-h" data-warna="green" id="sec-profil" tabIndex={-1}>Profil &amp; status</h2>
      </div>
      <form className="sec" noValidate onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}>
        <ProfilSection {...props} />
        <StatusSection {...props} />
        <SafetyTalkSection {...props} />
        <ShiftSection {...props} />
        <CuacaSection {...props} />
        <TemaSection {...props} />
        {(dirty || pending) && (
          <div className="save-bar" role="group" aria-label="Perubahan profil">
            <p className="save-bar-status" data-error={count ? "" : undefined}>
              <span className="dirty-dot" aria-hidden />
              {count ? `${count} isian perlu diperbaiki` : "Belum disimpan"}
            </p>
            <button type="button" className="btn" disabled={pending} onClick={() => {
              setEdits(null);
              setAttempted(false);
            }}>
              <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
              Batalkan
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              <FloppyDisk size={18} weight="bold" aria-hidden />
              {pending ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        )}
      </form>
      <p className="sr-only" aria-live="polite">{live}</p>
    </div>
  );
}

/* ---------- Profil ---------- */

export function ProfilSection({ site, update, errors }: Props) {
  const { profil } = site;
  const set = (patch: Partial<Site["profil"]>) => update((s) => ({ ...s, profil: { ...s.profil, ...patch } }));
  const e = (k: string) => errors[`profil.${k}`];

  return (
    <section className="panel" aria-labelledby={fid("profil")}>
      <h3 className="panel-title" id={fid("profil")} tabIndex={-1}>Profil</h3>

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
      <h3 className="panel-title" id={fid("status")} tabIndex={-1}>Status, kontak &amp; teks berjalan</h3>

      <Segmented name="mode" label="Mode status" id={fid("status.mode")} value={status.mode}
        onChange={(mode) => setStatus({ mode })}
        options={[{ value: "otomatis", label: "Otomatis" }, { value: "manual", label: "Manual" }]} />

      <Segmented name="zona" label="Zona waktu jam buka" id={fid("status.zona")} value={status.zona}
        onChange={(zona) => setStatus({ zona })}
        options={(Object.keys(ZONA) as Zona[]).map((z) => ({ value: z, label: ZONA[z] }))} />

      <div className="field">
        <label className="switch">
          <input type="checkbox" role="switch" checked={buka24(status)} aria-describedby={fid("status.24-hint")}
            onChange={(ev) => setStatus(ev.target.checked ? { jamBuka: 0, jamTutup: 24 } : { jamBuka: 8, jamTutup: 17 })} />
          <span>Buka 24 jam</span>
        </label>
        <p className="field-hint" id={fid("status.24-hint")}>Lampu hijau sepanjang hari dengan tulisan &ldquo;dibuka 24 jam&rdquo;. Hari libur tetap merah.</p>
      </div>

      {!buka24(status) && <div className="pair">
        <Field path="status.jamBuka" label="Jam buka" error={e("status.jamBuka")}>
          <NumberInput {...wire("status.jamBuka", e("status.jamBuka"))} min={0} max={23}
            value={status.jamBuka} onValue={(jamBuka) => setStatus({ jamBuka })} />
        </Field>
        <Field path="status.jamTutup" label="Jam tutup" error={e("status.jamTutup")}>
          <NumberInput {...wire("status.jamTutup", e("status.jamTutup"))} min={1} max={24}
            value={status.jamTutup} onValue={(jamTutup) => setStatus({ jamTutup })} />
        </Field>
      </div>}

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


/* ---------- Safety talk (K3) ---------- */

export function SafetyTalkSection({ site, update, errors, announce, today }: Props) {
  const list = site.safetyTalk;
  const setList = (fn: (t: Site["safetyTalk"]) => Site["safetyTalk"]) => update((s) => ({ ...s, safetyTalk: fn(s.safetyTalk) }));
  const shown = safetyTalkFor(list, today);
  // The row safetyTalkFor picked: a message dated today, else the undated one whose turn it is.
  const shownAt = list.findIndex((t) => t.teks === shown && t.tanggal === today);
  const at = shownAt >= 0 ? shownAt : list.findIndex((t) => t.teks === shown && !t.tanggal);

  return (
    <section className="panel" aria-labelledby={fid("safetyTalk")}>
      <h3 className="panel-title" id={fid("safetyTalk")} tabIndex={-1}>Safety talk (K3)</h3>
      <p className="field-hint" aria-live="polite">
        {shown ? <>Hari ini tampil: &ldquo;{shown}&rdquo;</> : "Belum ada pesan untuk hari ini."}
        {" "}Pesan bertanggal tampil di tanggalnya; yang tanpa tanggal bergiliran tiap hari.
      </p>
      <ol className="stack">
        {list.map((t, i) => {
          const err = errors[`safetyTalk.${i}.teks`];
          const errTgl = errors[`safetyTalk.${i}.tanggal`];
          return (
            <li key={i} className="talk-row">
              <div className="talk-teks">
                <input {...wire(`safetyTalk.${i}.teks`, err)} aria-label={`Pesan ${i + 1}`} value={t.teks} maxLength={120}
                  placeholder="mis. Cek APD sebelum mulai kerja"
                  onChange={(ev) => setList((all) => all.map((x, j) => (j === i ? { ...x, teks: ev.target.value } : x)))} />
                {i === at && <span className="d-tag" data-tone="yellow">Hari ini</span>}
              </div>
              <input {...wire(`safetyTalk.${i}.tanggal`, errTgl)} type="date" aria-label={`Tanggal pesan ${i + 1}, kosong = bergiliran`}
                value={t.tanggal ?? ""}
                onChange={(ev) => setList((all) => all.map((x, j) => (j === i ? { ...x, tanggal: ev.target.value || undefined } : x)))} />
              <RowTools prefix={`st-${i}`} name={`pesan ${i + 1}`} first={i === 0} last={i === list.length - 1}
                onMove={(d) => {
                  setList((all) => swap(all, i, i + d));
                  focusLater(`st-${i + d}-${d < 0 ? "up" : "down"}`, `st-${i + d}-${d < 0 ? "down" : "up"}`);
                }}
                onRemove={() => {
                  setList((all) => all.filter((_, j) => j !== i));
                  announce(`Pesan ${i + 1} dihapus.`);
                  focusLater(`st-${i}-del`, `st-${i - 1}-del`, "st-add");
                }} />
              {err && <p className="field-error" id={`${fid(`safetyTalk.${i}.teks`)}-err`}>{err}</p>}
              {errTgl && <p className="field-error" id={`${fid(`safetyTalk.${i}.tanggal`)}-err`}>{errTgl}</p>}
            </li>
          );
        })}
      </ol>
      <div className="add-row">
        <button type="button" className="btn" id="st-add" disabled={list.length >= TALK_MAX}
          onClick={() => {
            setList((all) => [...all, { teks: "" }]);
            focusLater(fid(`safetyTalk.${list.length}.teks`));
          }}>
          <Plus size={18} weight="bold" aria-hidden />
          Tambah pesan
        </button>
        <span className="field-hint">{list.length}/{TALK_MAX}</span>
      </div>
    </section>
  );
}

/* ---------- Jam ganti shift ---------- */

export function ShiftSection({ site, update, errors, announce }: Props) {
  const shift = site.shift;
  const setShift = (fn: (t: string[]) => string[]) => update((s) => ({ ...s, shift: fn(s.shift) }));

  return (
    <section className="panel" aria-labelledby={fid("shift")}>
      <h3 className="panel-title" id={fid("shift")} tabIndex={-1}>Jam ganti shift</h3>
      <p className="field-hint">Zona {ZONA[site.status.zona]}. Diurutkan saat disimpan.</p>
      <ol className="shifts">
        {shift.map((t, i) => {
          const err = errors[`shift.${i}`];
          return (
            <li key={i} className="shift-row">
              <input {...wire(`shift.${i}`, err)} type="time" step={60} aria-label={`Jam shift ${i + 1}`} value={t}
                onChange={(ev) => setShift((all) => all.map((x, j) => (j === i ? ev.target.value : x)))} />
              <button type="button" className="icon-btn" data-danger id={`sh-${i}-del`} disabled={shift.length <= 1}
                aria-label={`Hapus jam shift ${i + 1}`}
                onClick={() => {
                  setShift((all) => all.filter((_, j) => j !== i));
                  announce(`Jam shift ${i + 1} dihapus.`);
                  focusLater(`sh-${i}-del`, `sh-${i - 1}-del`, "sh-add");
                }}>
                <X size={18} weight="bold" aria-hidden />
              </button>
              {err && <p className="field-error" id={`${fid(`shift.${i}`)}-err`}>{err}</p>}
            </li>
          );
        })}
      </ol>
      <div className="add-row">
        <button type="button" className="btn" id="sh-add" disabled={shift.length >= SHIFT_MAX}
          onClick={() => {
            setShift((all) => [...all, ""]);
            focusLater(fid(`shift.${shift.length}`));
          }}>
          <Plus size={18} weight="bold" aria-hidden />
          Tambah jam
        </button>
        <span className="field-hint">{shift.length}/{SHIFT_MAX}</span>
      </div>
    </section>
  );
}

/* ---------- Cuaca ---------- */

const GEO_ERROR: Record<number, string> = {
  1: "Izin lokasi ditolak. Isi koordinat manual.",
  2: "Lokasi tidak ditemukan. Isi koordinat manual.",
  3: "Terlalu lama mencari lokasi. Coba lagi.",
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export function CuacaSection({ site, update, errors }: Props) {
  const { cuaca } = site;
  const [locating, setLocating] = useState(false);
  const set = (patch: Partial<Site["cuaca"]>) => update((s) => ({ ...s, cuaca: { ...s.cuaca, ...patch } }));
  const e = (k: string) => errors[`cuaca.${k}`];
  const onMap = Number.isFinite(cuaca.lat) && Number.isFinite(cuaca.lon);

  function locate() {
    if (!navigator.geolocation) return toast.error("Browser ini tidak bisa membaca lokasi. Isi koordinat manual.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        set({ lat: round2(p.coords.latitude), lon: round2(p.coords.longitude) });
        toast.success("Koordinat diisi dari lokasi kamu");
      },
      (err) => {
        setLocating(false);
        toast.error(GEO_ERROR[err.code] ?? "Gagal membaca lokasi.");
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }

  return (
    <section className="panel" aria-labelledby={fid("cuaca")}>
      <h3 className="panel-title" id={fid("cuaca")} tabIndex={-1}>Cuaca</h3>
      <div className="field">
        <label className="switch">
          <input type="checkbox" role="switch" id={fid("cuaca.aktif")} checked={cuaca.aktif}
            aria-describedby={fid("cuaca.aktif-hint")} onChange={(ev) => set({ aktif: ev.target.checked })} />
          <span>Tampilkan cuaca</span>
        </label>
        <p className="field-hint" id={fid("cuaca.aktif-hint")}>Cuaca di lokasi site dari BMKG dan Open-Meteo. Keduanya gratis, tanpa API key.</p>
      </div>
      <Segmented name="cuaca-sumber" label="Sumber data" id={fid("cuaca.sumber")} value={cuaca.sumber}
        onChange={(sumber) => set({ sumber })}
        options={SUMBER_CUACA.map((v) => ({ value: v, label: SUMBER_NAME[v] }))} />
      <p className="field-hint">{SUMBER_HINT[cuaca.sumber]}</p>
      <LokasiBmkg adm4={cuaca.adm4} onPick={(patch) => set(patch)} />
      <Field path="cuaca.nama" label="Nama lokasi" error={e("nama")} hint={`${cuaca.nama.length}/40`}>
        <input {...wire("cuaca.nama", e("nama"), true)} value={cuaca.nama} maxLength={40} autoComplete="off"
          placeholder="mis. Site BIB" onChange={(ev) => set({ nama: ev.target.value })} />
      </Field>
      <div className="pair">
        <Field path="cuaca.lat" label="Lintang (lat)" error={e("lat")} hint="-90–90">
          {/* No inputMode: the "decimal" keypad on iOS has no minus key, and these go negative. */}
          <NumberInput {...wire("cuaca.lat", e("lat"), true)} inputMode={undefined} step="any" min={-90} max={90}
            value={cuaca.lat} onValue={(lat) => set({ lat })} />
        </Field>
        <Field path="cuaca.lon" label="Bujur (lon)" error={e("lon")} hint="-180–180">
          <NumberInput {...wire("cuaca.lon", e("lon"), true)} inputMode={undefined} step="any" min={-180} max={180}
            value={cuaca.lon} onValue={(lon) => set({ lon })} />
        </Field>
      </div>
      <div className="add-row">
        <button type="button" className="btn" disabled={locating} aria-busy={locating || undefined} onClick={locate}>
          <Crosshair size={18} weight="bold" aria-hidden />
          {locating ? "Mencari lokasi…" : "Pakai lokasi saya"}
        </button>
        {onMap && (
          <a className="text-btn" href={`https://www.openstreetmap.org/?mlat=${cuaca.lat}&mlon=${cuaca.lon}`}
            target="_blank" rel="noopener noreferrer">
            <MapPin size={16} weight="bold" aria-hidden /> Cek di peta<span className="sr-only"> (tab baru)</span>
          </a>
        )}
      </div>
    </section>
  );
}

const SUMBER_NAME: Record<Site["cuaca"]["sumber"], string> = { gabungan: "Gabungan", bmkg: "BMKG", "open-meteo": "Open-Meteo" };
const SUMBER_HINT: Record<Site["cuaca"]["sumber"], string> = {
  gabungan: "Kondisi, suhu, dan curah hujan (mm) dari BMKG; peluang hujan (%) dari Open-Meteo. Kalau satu tidak menjawab, yang lain tetap tampil.",
  bmkg: "Hanya BMKG: data resmi per desa (kondisi, suhu, curah hujan mm).",
  "open-meteo": "Hanya Open-Meteo: memakai koordinat di bawah, termasuk peluang hujan (%).",
};
const LEVELS = [
  { label: "Provinsi", len: 2 },
  { label: "Kabupaten/kota", len: 5 },
  { label: "Kecamatan", len: 8 },
  { label: "Desa/kelurahan", len: 13 },
] as const;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * BMKG forecasts are per village. Pick it down the region tree (wilayah.id, via a server action);
 * the village's coordinates come from BMKG itself, so Open-Meteo looks at the same spot.
 */
function LokasiBmkg({ adm4, onPick }: { adm4: string; onPick: (patch: Partial<Site["cuaca"]>) => void }) {
  // Chosen code per level; the village level is the saved adm4.
  const [sel, setSel] = useState<string[]>(() => LEVELS.map((l) => adm4.slice(0, l.len)));
  const [lists, setLists] = useState<(Wilayah[] | undefined)[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => setSel(LEVELS.map((l) => adm4.slice(0, l.len))), [adm4]);

  // Load each level whose parent is chosen (provinces need no parent).
  const parents = ["", ...sel.slice(0, 3)];
  const parentKey = parents.join("|");
  useEffect(() => {
    let live = true;
    parents.forEach((p, i) => {
      if (i > 0 && !p) return;
      void wilayah(p).then((r) => {
        if (!live) return;
        if (!r.ok) return toast.error(r.error);
        setLists((ls) => Object.assign([...ls], { [i]: r.items }));
      });
    });
    return () => void (live = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentKey]);

  async function pickDesa(code: string) {
    setChecking(true);
    try {
      const r = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(code)}`);
      const j = r.ok ? await r.json() : null;
      const l = j?.lokasi;
      if (typeof l?.lat === "number" && typeof l?.lon === "number") {
        const desa = typeof l.desa === "string" ? l.desa.slice(0, 40) : "";
        onPick({ adm4: code, lat: round4(l.lat), lon: round4(l.lon), ...(desa && { nama: desa }) });
        toast.success(`Lokasi cuaca: ${l.desa}, ${l.kecamatan}. Koordinat diambil dari BMKG.`);
      } else {
        onPick({ adm4: code });
        toast.info("BMKG belum punya prakiraan untuk desa ini. Cuaca memakai Open-Meteo dari koordinat di bawah.");
      }
    } catch {
      onPick({ adm4: code });
      toast.error("BMKG tidak bisa dihubungi. Kode desa tetap disimpan; cek lagi nanti.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <fieldset className="field lokasi-bmkg" aria-busy={checking || undefined}>
      <legend>Lokasi BMKG</legend>
      <div className="lokasi-grid">
        {LEVELS.map((lv, i) => {
          const list = lists[i];
          const disabled = (i > 0 && !sel[i - 1]) || !list;
          return (
            <label key={lv.label} className="lokasi-level">
              <span>{lv.label}</span>
              <select value={sel[i]} disabled={disabled || checking}
                onChange={(ev) => {
                  const code = ev.target.value;
                  const next = sel.map((v, k) => (k < i ? v : k === i ? code : ""));
                  setSel(next);
                  setLists((ls) => ls.map((x, k) => (k > i ? undefined : x)));
                  if (i === LEVELS.length - 1 && code) void pickDesa(code);
                }}>
                <option value="">{list ? `Pilih ${lv.label.toLowerCase()}` : i > 0 && !sel[i - 1] ? "—" : "Memuat…"}</option>
                {list?.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select>
            </label>
          );
        })}
      </div>
      <p className="field-hint">
        Kode desa BMKG: <code>{adm4}</code>{checking ? " · mengecek BMKG…" : ""}. Data wilayah dari wilayah.id.
      </p>
    </fieldset>
  );
}

/* ---------- Tema halaman ---------- */

const TEMA_NAME: Record<Tema, string> = {
  otomatis: "Otomatis (ikut kalender)", standar: "Standar", "hut-ri": "HUT RI", "bulan-k3": "Bulan K3", "hut-ppa": "HUT PPA",
};

export function TemaSection({ site, update, today }: Props) {
  return (
    <section className="panel" aria-labelledby={fid("tema-title")}>
      <h3 className="panel-title" id={fid("tema-title")} tabIndex={-1}>Tema halaman</h3>
      <Field path="tema" label="Tema" hint={<span aria-live="polite">Hari ini: {TEMA_NAME[temaFor(site.tema, today)]}</span>}>
        <select {...wire("tema", undefined, true)} value={site.tema}
          onChange={(ev) => update((s) => ({ ...s, tema: ev.target.value as Tema }))}>
          {TEMA.map((t) => <option key={t} value={t}>{TEMA_NAME[t]}</option>)}
        </select>
      </Field>
      {site.tema === "otomatis" && <p className="field-hint">Agustus: HUT RI. 12 Jan–12 Feb: Bulan K3. Selain itu: Standar.</p>}
    </section>
  );
}
