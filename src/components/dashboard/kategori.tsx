"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { Day } from "@/lib/analytics";
import { WARNA, kategoriSchema, type Kategori, type Site } from "@/lib/site";
import { Field, Plate, WARNA_NAME, focusLater, insertAt, slugify, swap, uniqueSlug } from "./controls";
import { Confirm, Modal } from "./modal";
import { fmt, sum } from "./stats";
import { EXPIRED, toast } from "./toast";
import type { Commit } from "./dashboard";

const KATEGORI_MAX = 12;

/** Rename/recolour category `from`, re-pointing its links when the id changes. */
function replaceKategori(s: Site, from: string, k: Kategori): Site {
  return {
    ...s,
    kategori: s.kategori.map((x) => (x.id === from ? k : x)),
    link: from === k.id ? s.link : s.link.map((l) => (l.kategori === from ? { ...l, kategori: k.id } : l)),
  };
}

export function KategoriTab({ site, days, commit }: { site: Site; days: Day[]; commit: Commit }) {
  const [edit, setEdit] = useState<{ id?: string } | null>(null);
  const [removing, setRemoving] = useState<Kategori | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState("");
  const all = useMemo(() => sum(days), [days]);
  const stats = useMemo(() => {
    const m = new Map<string, { links: number; klik: number }>();
    for (const l of site.link) {
      const s = m.get(l.kategori) ?? { links: 0, klik: 0 };
      s.links++;
      s.klik += all[`l:${l.id}`] ?? 0;
      m.set(l.kategori, s);
    }
    return m;
  }, [site.link, all]);
  const full = site.kategori.length >= KATEGORI_MAX;
  const editing = edit?.id ? site.kategori.find((k) => k.id === edit.id) : undefined;

  function move(k: Kategori, i: number, d: -1 | 1) {
    void commit((s) => {
      const a = s.kategori.findIndex((x) => x.id === k.id);
      return a < 0 || !s.kategori[a + d] ? s : { ...s, kategori: swap(s.kategori, a, a + d) };
    });
    setLive(`${k.nama} dipindah ke posisi ${i + d + 1} dari ${site.kategori.length}.`);
    focusLater(`kt-${k.id}-${d < 0 ? "up" : "down"}`, `kt-${k.id}-${d < 0 ? "down" : "up"}`);
  }

  async function remove(k: Kategori, to?: string) {
    const at = site.kategori.findIndex((x) => x.id === k.id);
    const moved = site.link.filter((l) => l.kategori === k.id).map((l) => l.id);
    if (moved.length && !to) return;
    setPending(true);
    const r = await commit((s) => ({
      ...s,
      link: to ? s.link.map((l) => (l.kategori === k.id ? { ...l, kategori: to } : l)) : s.link,
      kategori: s.kategori.filter((x) => x.id !== k.id),
    }));
    setPending(false);
    setRemoving(null);
    if (!r.ok) return;
    focusLater("kt-add");
    const toName = site.kategori.find((x) => x.id === to)?.nama;
    toast.undo(moved.length ? `Kategori dihapus, ${moved.length} tautan pindah ke ${toName}` : "Kategori dihapus", () => {
      void commit((s) => {
        if (s.kategori.some((x) => x.id === k.id)) return s;
        const ids = new Set(moved);
        return {
          ...s,
          kategori: insertAt(s.kategori, Math.min(at, s.kategori.length), k),
          link: s.link.map((l) => (ids.has(l.id) ? { ...l, kategori: k.id } : l)),
        };
      }, { done: "Kategori dikembalikan" });
    });
  }

  const others = removing ? site.kategori.filter((x) => x.id !== removing.id) : [];
  const usedBy = removing ? (stats.get(removing.id)?.links ?? 0) : 0;

  return (
    <div className="sec">
      <div className="sec-head">
        <h2 className="plate-h" data-warna="blue" id="sec-kategori" tabIndex={-1}>Kategori</h2>
        <div className="sec-tools">
          <button type="button" className="btn btn-primary" id="kt-add" disabled={full}
            aria-describedby={full ? "kt-full" : undefined} onClick={() => setEdit({})}>
            <Plus size={18} weight="bold" aria-hidden />
            Tambah kategori
          </button>
        </div>
      </div>
      {full && <p className="field-hint" id="kt-full">Maksimal {KATEGORI_MAX} kategori.</p>}

      <section className="panel" aria-label="Daftar kategori">
        <p className="field-hint">Tiap kategori jadi satu jalur rambu di halaman publik, urut dari atas. Jalur tanpa tautan tidak tampil.</p>
        {site.kategori.length === 0 ? (
          <div className="empty-mini"><p>Belum ada kategori. Tautan butuh kategori sebagai jalurnya.</p></div>
        ) : (
          <ol className="rows">
            {site.kategori.map((k, i) => {
              const st = stats.get(k.id) ?? { links: 0, klik: 0 };
              return (
                <li key={k.id} className="row" onKeyDown={(e) => {
                  if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                  const d = e.key === "ArrowUp" ? -1 : 1;
                  if (!site.kategori[i + d]) return;
                  e.preventDefault();
                  move(k, i, d);
                }}>
                  <span className="row-pos" aria-hidden>{i + 1}</span>
                  <div className="row-main">
                    <div className="row-title">
                      <Plate warna={k.warna}>{k.nama}</Plate>
                    </div>
                    <span className="row-url">#jalur-{k.id}</span>
                    <span className="row-tags">
                      <span className="row-klik"><b>{st.links}</b> tautan</span>
                      <span className="row-klik"><b>{fmt(st.klik)}</b> klik</span>
                    </span>
                  </div>
                  <div className="row-actions" role="group" aria-label={`Aksi untuk ${k.nama}`}>
                    <button type="button" className="icon-btn" id={`kt-${k.id}-up`} disabled={i === 0}
                      aria-label={`Naikkan ${k.nama}`} aria-keyshortcuts="Alt+ArrowUp" onClick={() => move(k, i, -1)}>
                      <ArrowUp size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" id={`kt-${k.id}-down`} disabled={i === site.kategori.length - 1}
                      aria-label={`Turunkan ${k.nama}`} aria-keyshortcuts="Alt+ArrowDown" onClick={() => move(k, i, 1)}>
                      <ArrowDown size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Ubah ${k.nama}`} onClick={() => setEdit({ id: k.id })}>
                      <PencilSimple size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" data-danger aria-label={`Hapus ${k.nama}`}
                      onClick={() => {
                        if (!st.links) return void remove(k);
                        setMoveTo(site.kategori.find((x) => x.id !== k.id)?.id ?? "");
                        setRemoving(k);
                      }}>
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

      <KategoriForm key={edit ? (edit.id ?? "baru") : "closed"} open={!!edit && (!edit.id || !!editing)} kategori={editing}
        site={site} commit={commit} onClose={() => setEdit(null)} />

      {others.length > 0 ? (
        <Confirm open={!!removing} title={`Hapus kategori ${removing?.nama ?? ""}?`} confirmLabel="Pindahkan & hapus" danger
          pending={pending} onClose={() => setRemoving(null)} onConfirm={() => removing && void remove(removing, moveTo)}>
          <p>{usedBy} tautan masih memakai kategori ini. Pindahkan dulu ke kategori lain, lalu kategori ini dihapus.</p>
          <div className="field">
            <label htmlFor="kt-move-to">Pindahkan tautan ke…</label>
            <select id="kt-move-to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              {others.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
            </select>
          </div>
        </Confirm>
      ) : (
        <Modal open={!!removing} title="Kategori masih dipakai" onClose={() => setRemoving(null)}
          footer={<button type="button" className="btn" onClick={() => setRemoving(null)} data-autofocus="">Mengerti</button>}>
          <p>{usedBy} tautan memakai kategori ini dan belum ada kategori lain untuk menampungnya. Buat kategori baru dulu, atau hapus tautannya di bagian Tautan.</p>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Add / edit form ---------- */

function KategoriForm({ open, kategori, site, commit, onClose }: {
  open: boolean; kategori: Kategori | undefined; site: Site; commit: Commit; onClose: () => void;
}) {
  const taken = site.kategori.filter((k) => k.id !== kategori?.id).map((k) => k.id);
  const start = useMemo<Kategori>(() => {
    if (kategori) return kategori;
    const used = new Set(site.kategori.map((k) => k.warna));
    return { id: "", nama: "", warna: WARNA.find((w) => !used.has(w)) ?? "green" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategori]);
  const [d, setD] = useState(start);
  // The id follows the name until the admin edits it by hand (only for new categories; renaming
  // an existing one keeps its id so shared #jalur- links keep working).
  const [autoId, setAutoId] = useState(!kategori);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [formError, setFormError] = useState("");
  const dirty = JSON.stringify(d) !== JSON.stringify(start);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    const r = kategoriSchema.safeParse(d);
    if (!r.success) for (const i of r.error.issues) out[String(i.path[0])] ??= i.message;
    if (taken.includes(d.id)) out.id = "ID ini sudah dipakai kategori lain";
    return out;
  }, [d, taken]);
  const show = (k: string) => (submitted || touched.has(k) ? errors[k] : undefined);
  const close = () => (dirty && !pending ? setDiscard(true) : onClose());
  const wire = (k: string, hint?: boolean) => {
    const e = show(k);
    const by = [e && `kf-${k}-err`, hint && `kf-${k}-hint`].filter(Boolean).join(" ");
    return {
      id: `kf-${k}`, "aria-invalid": e ? true : undefined, "aria-describedby": by || undefined,
      onBlur: () => setTouched((t) => new Set(t).add(k)),
    };
  };
  const ids = (k: string) => ({ input: `kf-${k}`, err: `kf-${k}-err`, hint: `kf-${k}-hint` });

  async function submit() {
    setSubmitted(true);
    const bad = ["nama", "id"].find((k) => errors[k]);
    if (bad) return document.getElementById(`kf-${bad}`)?.focus();
    const value = kategoriSchema.parse(d);
    setPending(true);
    const r = await commit(
      (s) => (kategori ? replaceKategori(s, kategori.id, value) : { ...s, kategori: [...s.kategori, value] }),
      { form: true, done: kategori ? "Kategori diperbarui" : "Kategori ditambahkan" },
    );
    setPending(false);
    if (r.ok) onClose();
    else if (!EXPIRED.test(r.error)) setFormError(r.error);
  }

  return (
    <>
      <Modal open={open} onClose={close} variant="drawer" title={kategori ? "Ubah kategori" : "Tambah kategori"}
        footer={
          <>
            {dirty && <span className="dirty-note"><span className="dirty-dot" aria-hidden />Belum disimpan</span>}
            <button type="button" className="btn" onClick={close}>Batal</button>
            <button type="submit" form="kat-form" className="btn btn-primary" disabled={pending || (!!kategori && !dirty)}>
              {pending ? "Menyimpan…" : kategori ? "Simpan perubahan" : "Tambah kategori"}
            </button>
          </>
        }>
        <form id="kat-form" className="form-grid" noValidate onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}>
          {formError && <p className="form-error" role="alert">Gagal menyimpan: {formError}</p>}
          <div className="kat-sample" aria-hidden>
            <Plate warna={d.warna}>{d.nama || "Nama jalur"}</Plate>
          </div>
          <Field path="nama" label="Nama" error={show("nama")} hint={`${d.nama.length}/24`} ids={ids("nama")}>
            <input {...wire("nama", true)} value={d.nama} maxLength={24} autoComplete="off" data-autofocus=""
              placeholder="mis. Sosial"
              onChange={(e) => {
                const nama = e.target.value;
                setFormError("");
                setD((v) => ({ ...v, nama, ...(autoId && { id: uniqueSlug(slugify(nama), taken) }) }));
              }} />
          </Field>
          <Field path="id" label="ID" error={show("id")} ids={ids("id")}
            hint={d.id ? `alamat jalur: #jalur-${d.id}` : "huruf kecil, angka, tanda hubung"}>
            <input {...wire("id", true)} value={d.id} maxLength={24} autoCapitalize="off" autoComplete="off" spellCheck={false}
              onChange={(e) => {
                setAutoId(false);
                setFormError("");
                setD((v) => ({ ...v, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) }));
              }} />
          </Field>
          {kategori && d.id !== kategori.id && (
            <p className="field-hint">Tautan di kategori ini ikut pindah ke ID baru. Tautan lama ke #jalur-{kategori.id} tidak lagi mengarah ke jalurnya.</p>
          )}
          <fieldset className="field">
            <legend>Warna plat</legend>
            <div className="swatches">
              {WARNA.map((w) => (
                <label key={w} className="swatch">
                  <input type="radio" name="kf-warna" value={w} checked={d.warna === w}
                    onChange={() => setD((v) => ({ ...v, warna: w }))} />
                  <Plate warna={w}>
                    {d.warna === w && <Check size={20} weight="bold" aria-hidden />}
                    <span className="sr-only">{WARNA_NAME[w]}</span>
                  </Plate>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </Modal>
      <Confirm open={discard} title="Buang perubahan?" confirmLabel="Buang" danger onClose={() => setDiscard(false)}
        onConfirm={() => {
          setDiscard(false);
          onClose();
        }}>
        <p>Isian di formulir kategori belum disimpan.</p>
      </Confirm>
    </>
  );
}
