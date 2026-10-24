"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowSquareOut, ArrowUp, PencilSimple, Phone, Plus, Trash, WhatsappLogo } from "@phosphor-icons/react";
import { anggotaSchema, type Anggota, type Site } from "@/lib/site";
import { Foto } from "@/components/tim/foto";
import { keTelp, keWa, tampilNomor } from "@/components/tim/tim";
import { Field, Plate, focusLater, insertAt, newId, swap } from "./controls";
import { Confirm, Modal } from "./modal";
import { EXPIRED, toast } from "./toast";
import type { Commit } from "./dashboard";
import "./tim.css";

const TIM_MAX = 60;

export function TimTab({ site, commit }: { site: Site; commit: Commit }) {
  const [edit, setEdit] = useState<{ id?: string } | null>(null);
  const [removing, setRemoving] = useState<Anggota | null>(null);
  const [live, setLive] = useState("");
  const kat = new Map(site.kategori.map((k) => [k.id, k]));
  const full = site.tim.length >= TIM_MAX;
  const editing = edit?.id ? site.tim.find((a) => a.id === edit.id) : undefined;

  function move(a: Anggota, i: number, d: -1 | 1) {
    void commit((s) => {
      const at = s.tim.findIndex((x) => x.id === a.id);
      return at < 0 || !s.tim[at + d] ? s : { ...s, tim: swap(s.tim, at, at + d) };
    });
    setLive(`${a.nama} dipindah ke posisi ${i + d + 1} dari ${site.tim.length}.`);
    focusLater(`tm-${a.id}-${d < 0 ? "up" : "down"}`, `tm-${a.id}-${d < 0 ? "down" : "up"}`);
  }

  async function remove(a: Anggota) {
    const at = site.tim.findIndex((x) => x.id === a.id);
    setRemoving(null);
    const r = await commit((s) => ({ ...s, tim: s.tim.filter((x) => x.id !== a.id) }));
    if (!r.ok) return;
    focusLater("tm-add");
    toast.undo(`${a.nama} dihapus dari tim`, () => {
      void commit((s) => (s.tim.some((x) => x.id === a.id) ? s : { ...s, tim: insertAt(s.tim, Math.min(at, s.tim.length), a) }),
        { done: `${a.nama} dikembalikan` });
    });
  }

  return (
    <div className="sec">
      <div className="sec-head">
        <h2 className="plate-h" data-warna="green" id="sec-tim" tabIndex={-1}>Tim</h2>
        <div className="sec-tools">
          <a className="btn" href="/tim" target="_blank" rel="noopener">
            <ArrowSquareOut size={18} weight="bold" aria-hidden />
            Lihat halaman tim
          </a>
          <button type="button" className="btn btn-primary" id="tm-add" disabled={full}
            aria-describedby={full ? "tm-full" : undefined} onClick={() => setEdit({})}>
            <Plus size={18} weight="bold" aria-hidden />
            Tambah anggota
          </button>
        </div>
      </div>
      {full && <p className="field-hint" id="tm-full">Maksimal {TIM_MAX} anggota.</p>}

      <section className="panel" aria-label="Daftar anggota tim">
        <p className="field-hint">Tampil di halaman /tim, dikelompokkan per jalur. Urutan di sini jadi urutan di tiap jalur.</p>
        {site.tim.length === 0 ? (
          <div className="empty-mini">
            <p>Belum ada anggota. Tambahkan petugas supaya pengunjung tahu siapa yang bisa dihubungi.</p>
          </div>
        ) : (
          <ol className="rows">
            {site.tim.map((a, i) => {
              const k = kat.get(a.jalur);
              return (
                <li key={a.id} className="row" onKeyDown={(e) => {
                  if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                  const d = e.key === "ArrowUp" ? -1 : 1;
                  if (!site.tim[i + d]) return;
                  e.preventDefault();
                  move(a, i, d);
                }}>
                  <span className="row-pos" aria-hidden>{i + 1}</span>
                  <div className="row-main tm-main">
                    <Foto src={a.foto} nama={a.nama} size={44} />
                    <div className="tm-text">
                      <span className="row-judul" dir="auto">{a.nama}</span>
                      {a.peran && <span className="row-url" dir="auto">{a.peran}</span>}
                      <span className="row-tags">
                        <Plate warna={k?.warna ?? "yellow"} ikon={k?.ikon ?? "umum"} small>{k?.nama ?? "Seluruh tim"}</Plate>
                        {a.telp && <span className="row-klik tm-kontak"><Phone size={14} weight="bold" aria-hidden />{tampilNomor(a.telp)}</span>}
                        {a.wa && <span className="row-klik tm-kontak"><WhatsappLogo size={14} weight="bold" aria-hidden />{tampilNomor(a.wa)}</span>}
                      </span>
                    </div>
                  </div>
                  <div className="row-actions" role="group" aria-label={`Aksi untuk ${a.nama}`}>
                    <button type="button" className="icon-btn" id={`tm-${a.id}-up`} disabled={i === 0}
                      aria-label={`Naikkan ${a.nama}`} aria-keyshortcuts="Alt+ArrowUp" onClick={() => move(a, i, -1)}>
                      <ArrowUp size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" id={`tm-${a.id}-down`} disabled={i === site.tim.length - 1}
                      aria-label={`Turunkan ${a.nama}`} aria-keyshortcuts="Alt+ArrowDown" onClick={() => move(a, i, 1)}>
                      <ArrowDown size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Ubah ${a.nama}`} onClick={() => setEdit({ id: a.id })}>
                      <PencilSimple size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" data-danger aria-label={`Hapus ${a.nama}`} onClick={() => setRemoving(a)}>
                      <Trash size={18} weight="bold" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <p className="sr-only" aria-live="polite">{live}</p>

      <AnggotaForm key={edit ? (edit.id ?? "baru") : "closed"} open={!!edit && (!edit.id || !!editing)} anggota={editing}
        site={site} commit={commit} onClose={() => setEdit(null)} />

      <Confirm open={!!removing} title={`Hapus ${removing?.nama ?? ""} dari tim?`} confirmLabel="Hapus" danger
        onClose={() => setRemoving(null)} onConfirm={() => removing && void remove(removing)}>
        <p>Kartunya hilang dari halaman tim. Bisa diurungkan sesaat setelah dihapus.</p>
      </Confirm>
    </div>
  );
}

/* ---------- Add / edit form ---------- */

/** What the admin types: phone numbers in any common form, normalised on save. */
type Draft = { nama: string; peran: string; jalur: string; foto: string; wa: string; telp: string };

function AnggotaForm({ open, anggota, site, commit, onClose }: {
  open: boolean; anggota: Anggota | undefined; site: Site; commit: Commit; onClose: () => void;
}) {
  const start = useMemo<Draft>(() => ({
    nama: anggota?.nama ?? "", peran: anggota?.peran ?? "", jalur: anggota?.jalur ?? "", foto: anggota?.foto ?? "",
    wa: tampilNomor(anggota?.wa ?? ""), telp: tampilNomor(anggota?.telp ?? ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [anggota]);
  const [d, setD] = useState(start);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [formError, setFormError] = useState("");
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  // A lane deleted since this member was saved: keep it selectable so the form shows what is stored.
  const lostLane = !!d.jalur && !site.kategori.some((k) => k.id === d.jalur);

  const { value, errors } = useMemo(() => {
    const out: Record<string, string> = {};
    const wa = keWa(d.wa);
    const telp = keTelp(d.telp);
    if (wa === null) out.wa = "Nomor WhatsApp tidak dikenali. Contoh: 0812 3456 7890";
    if (telp === null) out.telp = "Nomor telepon tidak dikenali. Contoh: 0812 3456 7890";
    const r = anggotaSchema.safeParse({ id: anggota?.id ?? newId(), ...d, foto: d.foto.trim(), wa: wa ?? "", telp: telp ?? "" });
    if (!r.success) for (const i of r.error.issues) out[String(i.path[0])] ??= i.message;
    if (lostLane) out.jalur = "Jalur ini sudah dihapus. Pilih jalur lain.";
    return { value: r.success && !Object.keys(out).length ? r.data : null, errors: out };
  }, [d, anggota, lostLane]);
  const show = (k: string) => (submitted || touched.has(k) ? errors[k] : undefined);
  const close = () => (dirty && !pending ? setDiscard(true) : onClose());
  const wire = (k: string, hint?: boolean) => {
    const e = show(k);
    const by = [e && `tf-${k}-err`, hint && `tf-${k}-hint`].filter(Boolean).join(" ");
    return {
      id: `tf-${k}`, "aria-invalid": e ? true : undefined, "aria-describedby": by || undefined,
      onBlur: () => setTouched((t) => new Set(t).add(k)),
    };
  };
  const ids = (k: string) => ({ input: `tf-${k}`, err: `tf-${k}-err`, hint: `tf-${k}-hint` });
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => {
    setFormError("");
    setD((v) => ({ ...v, [k]: e.target.value }));
  };

  async function submit() {
    setSubmitted(true);
    const bad = ["nama", "peran", "jalur", "foto", "wa", "telp"].find((k) => errors[k]);
    if (bad || !value) return document.getElementById(`tf-${bad ?? "nama"}`)?.focus();
    setPending(true);
    const r = await commit(
      (s) => ({ ...s, tim: anggota ? s.tim.map((x) => (x.id === anggota.id ? value : x)) : [...s.tim, value] }),
      { form: true, done: anggota ? "Anggota diperbarui" : "Anggota ditambahkan" },
    );
    setPending(false);
    if (r.ok) onClose();
    else if (!EXPIRED.test(r.error)) setFormError(r.error);
  }

  const fotoOk = d.foto.trim().startsWith("https://") && !errors.foto;

  return (
    <>
      <Modal open={open} onClose={close} variant="drawer" title={anggota ? "Ubah anggota" : "Tambah anggota"}
        footer={
          <>
            {dirty && <span className="dirty-note"><span className="dirty-dot" aria-hidden />Belum disimpan</span>}
            <button type="button" className="btn" onClick={close}>Batal</button>
            <button type="submit" form="tim-form" className="btn btn-primary" disabled={pending || (!!anggota && !dirty)}>
              {pending ? "Menyimpan…" : anggota ? "Simpan perubahan" : "Tambah anggota"}
            </button>
          </>
        }>
        <form id="tim-form" className="form-grid" noValidate onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}>
          {formError && <p className="form-error" role="alert">Gagal menyimpan: {formError}</p>}
          <Field path="nama" label="Nama" error={show("nama")} hint={`${d.nama.length}/40`} ids={ids("nama")}>
            <input {...wire("nama", true)} value={d.nama} maxLength={40} autoComplete="off" data-autofocus=""
              placeholder="mis. Budi Santoso" onChange={set("nama")} />
          </Field>
          <Field path="peran" label="Peran" error={show("peran")} hint={`${d.peran.length}/40`} ids={ids("peran")}>
            <input {...wire("peran", true)} value={d.peran} maxLength={40} autoComplete="off"
              placeholder="mis. Pengawas shift malam" onChange={set("peran")} />
          </Field>
          <Field path="jalur" label="Jalur" error={show("jalur")} hint="kelompok di halaman tim" ids={ids("jalur")}>
            <select {...wire("jalur", true)} value={d.jalur} onChange={set("jalur")}>
              <option value="">Seluruh tim</option>
              {site.kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              {lostLane && <option value={d.jalur}>{d.jalur} (dihapus)</option>}
            </select>
          </Field>
          <Field path="foto" label="Foto (opsional)" error={show("foto")} hint="link gambar https://" ids={ids("foto")}>
            <div className="tm-foto">
              <Foto src={fotoOk ? d.foto.trim() : ""} nama={d.nama || "?"} size={64} />
              <input {...wire("foto", true)} value={d.foto} type="url" inputMode="url" autoCapitalize="off" autoComplete="off"
                spellCheck={false} placeholder="https://…/foto.jpg" onChange={set("foto")} />
            </div>
          </Field>
          <Field path="wa" label="WhatsApp (opsional)" error={show("wa")} hint="08…, +62… atau 62…" ids={ids("wa")}>
            <input {...wire("wa", true)} value={d.wa} type="tel" inputMode="tel" autoComplete="off"
              placeholder="0812 3456 7890" onChange={set("wa")} />
          </Field>
          <Field path="telp" label="Telepon (opsional)" error={show("telp")} hint="08…, +62… atau 62…" ids={ids("telp")}>
            <input {...wire("telp", true)} value={d.telp} type="tel" inputMode="tel" autoComplete="off"
              placeholder="0812 3456 7890" onChange={set("telp")} />
          </Field>
        </form>
      </Modal>
      <Confirm open={discard} title="Buang perubahan?" confirmLabel="Buang" danger onClose={() => setDiscard(false)}
        onConfirm={() => {
          setDiscard(false);
          onClose();
        }}>
        <p>Isian di formulir anggota belum disimpan.</p>
      </Confirm>
    </>
  );
}
