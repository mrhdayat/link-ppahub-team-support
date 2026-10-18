"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import { ArrowCounterClockwise, FloppyDisk, Plus } from "@phosphor-icons/react";
import { STATUS, ZONA, siteSchema, type Site, type StatusWarna, type Zona } from "@/lib/site";
import { Field, NumberInput, RowTools, Segmented, fid, focusLater, initialsOf, swap, wire } from "./controls";
import type { Commit } from "./dashboard";

export const PROFIL_KEYS = ["profil", "status", "balasMaksJam", "whatsapp", "teksBerjalan"] as const;
export type ProfilFields = Pick<Site, (typeof PROFIL_KEYS)[number]>;
const pick = (s: Site): ProfilFields =>
  Object.fromEntries(PROFIL_KEYS.map((k) => [k, s[k]])) as ProfilFields;

type Update = (fn: (s: Site) => Site) => void;
type Props = {
  site: Site;
  update: Update;
  errors: Record<string, string>;
  announce: (message: string) => void;
};

const TEKS_MAX = 6;

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
  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    if (attempted && !check.success) for (const i of check.error.issues) out[i.path.join(".")] ??= i.message;
    return out;
  }, [attempted, check]);
  const count = Object.keys(errors).length;

  const update: Update = (fn) => setEdits((prev) => pick(fn({ ...site, ...(prev ?? {}) })));

  async function onSave() {
    flushSync(() => setAttempted(true));
    if (!check.success) return focusPath(check.error.issues[0]!.path.join("."));
    const value = pick(check.data);
    setPending(true);
    const r = await commit((s) => ({ ...s, ...value }), { form: true, done: "Profil & status disimpan" });
    setPending(false);
    if (r.ok) {
      setEdits(null);
      setAttempted(false);
    } else if (r.path) focusPath(r.path);
  }

  const props = { site: draft, update, errors, announce: setLive };
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

