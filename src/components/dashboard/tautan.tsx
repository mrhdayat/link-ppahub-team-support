"use client";

import { useMemo, useState, type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction } from "react";
import {
  ArrowDown, ArrowUp, CopySimple, MagnifyingGlass, PencilSimple, Plus, Star, Trash,
} from "@phosphor-icons/react";
import type { Day } from "@/lib/analytics";
import { LABELS, linkSchema, type Link, type Site } from "@/lib/site";
import { Field, Plate, focusLater, insertAt, newId, swap } from "./controls";
import { Confirm, Modal } from "./modal";
import { fmt, sum } from "./stats";
import { EXPIRED, toast } from "./toast";
import type { Commit } from "./dashboard";

export type LinkEdit = { mode: "add" } | { mode: "edit"; id: string } | null;

const LINK_MAX = 200;
const UTAMA_MAX = 2;
export const LABEL_NAME: Record<(typeof LABELS)[number], string> = { baru: "Baru", populer: "Populer", promo: "Promo" };

type Filter = { q: string; kat: string; label: string; utama: boolean };
const NO_FILTER: Filter = { q: "", kat: "", label: "", utama: false };

export function Tautan({ site, days, commit, edit, setEdit }: {
  site: Site; days: Day[]; commit: Commit; edit: LinkEdit; setEdit: Dispatch<SetStateAction<LinkEdit>>;
}) {
  const [f, setF] = useState<Filter>(NO_FILTER);
  const [deleting, setDeleting] = useState<Link | null>(null);
  const [live, setLive] = useState("");
  const clicks = useMemo(() => sum(days), [days]);
  const katOf = useMemo(() => new Map(site.kategori.map((k) => [k.id, k])), [site.kategori]);
  const q = f.q.trim().toLocaleLowerCase("id");
  const visible = site.link
    .map((l, i) => ({ l, i }))
    .filter(({ l }) =>
      (!f.kat || l.kategori === f.kat) && (!f.label || (f.label === "none" ? !l.label : l.label === f.label))
      && (!f.utama || l.utama) && (!q || `${l.judul} ${l.url} ${l.catatan}`.toLocaleLowerCase("id").includes(q)));
  const filtered = f.q !== "" || f.kat !== "" || f.label !== "" || f.utama;
  const utamaCount = site.link.filter((l) => l.utama).length;
  const full = site.link.length >= LINK_MAX;
  const noKat = site.kategori.length === 0;
  const editing = edit?.mode === "edit" ? site.link.find((l) => l.id === edit.id) : undefined;

  function move(l: Link, pos: number, d: -1 | 1) {
    const target = visible[pos + d];
    if (!target) return;
    void commit((s) => {
      const i = s.link.findIndex((x) => x.id === l.id);
      const j = s.link.findIndex((x) => x.id === target.l.id);
      return i < 0 || j < 0 ? s : { ...s, link: swap(s.link, i, j) };
    });
    setLive(`${l.judul} dipindah ke posisi ${target.i + 1} dari ${site.link.length}.`);
    focusLater(`lk-${l.id}-${d < 0 ? "up" : "down"}`, `lk-${l.id}-${d < 0 ? "down" : "up"}`);
  }

  async function duplicate(l: Link) {
    const copy: Link = { ...l, id: newId(), judul: `${l.judul} (salinan)`.slice(0, 48), utama: false };
    const r = await commit((s) => {
      const i = s.link.findIndex((x) => x.id === l.id);
      return { ...s, link: insertAt(s.link, i < 0 ? s.link.length : i + 1, copy) };
    });
    if (r.ok) {
      toast.success("Tautan diduplikasi", [{ label: "Ubah", onClick: () => setEdit({ mode: "edit", id: copy.id }) }]);
      focusLater(`lk-${copy.id}-edit`);
    }
  }

  async function remove(l: Link) {
    const at = site.link.findIndex((x) => x.id === l.id);
    setDeleting(null);
    const r = await commit((s) => ({ ...s, link: s.link.filter((x) => x.id !== l.id) }));
    if (!r.ok) return;
    focusLater("lk-add");
    toast.undo("Tautan dihapus", () => {
      void commit((s) => {
        if (s.link.some((x) => x.id === l.id)) return s;
        // The gantry may have filled up meanwhile; restore as a normal sign rather than fail.
        const back = { ...l, utama: l.utama && s.link.filter((x) => x.utama).length < UTAMA_MAX };
        return { ...s, link: insertAt(s.link, Math.min(at, s.link.length), back) };
      }, { done: "Tautan dikembalikan" });
    });
  }

  return (
    <div className="sec">
      <div className="sec-head">
        <h2 className="plate-h" data-warna="red" id="sec-tautan" tabIndex={-1}>Tautan</h2>
        <div className="sec-tools">
          <button type="button" className="btn btn-primary" id="lk-add" disabled={full || noKat}
            aria-keyshortcuts="n" aria-describedby={full || noKat ? "lk-add-why" : undefined}
            onClick={() => setEdit({ mode: "add" })}>
            <Plus size={18} weight="bold" aria-hidden />
            Tambah tautan
            <kbd className="kbd desk-only" aria-hidden>N</kbd>
          </button>
        </div>
      </div>
      {(full || noKat) && (
        <p className="field-hint" id="lk-add-why">
          {noKat ? "Buat kategori dulu di bagian Kategori." : `Maksimal ${LINK_MAX} tautan. Hapus yang tidak dipakai.`}
        </p>
      )}

      <section className="panel" aria-label="Daftar tautan">
        <div className="filters">
          <div className="d-search">
            <MagnifyingGlass size={20} weight="bold" aria-hidden />
            <input type="search" aria-label="Cari tautan" placeholder="Cari judul, alamat, catatan" value={f.q}
              onChange={(e) => setF((v) => ({ ...v, q: e.target.value }))} />
          </div>
          <select aria-label="Saring kategori" value={f.kat} onChange={(e) => setF((v) => ({ ...v, kat: e.target.value }))}>
            <option value="">Semua kategori</option>
            {site.kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama} ({site.link.filter((l) => l.kategori === k.id).length})</option>
            ))}
          </select>
          <select aria-label="Saring label" value={f.label} onChange={(e) => setF((v) => ({ ...v, label: e.target.value }))}>
            <option value="">Semua label</option>
            {LABELS.map((x) => <option key={x} value={x}>{LABEL_NAME[x]}</option>)}
            <option value="none">Tanpa label</option>
          </select>
          <button type="button" className="chip" aria-pressed={f.utama} onClick={() => setF((v) => ({ ...v, utama: !v.utama }))}>
            <Star size={18} weight={f.utama ? "fill" : "bold"} aria-hidden />
            Utama saja
          </button>
        </div>
        <p className="field-hint" aria-live="polite">
          {visible.length} dari {site.link.length} tautan · {utamaCount}/{UTAMA_MAX} utama
          {filtered && (
            <> · <button type="button" className="text-btn" onClick={() => setF(NO_FILTER)}>Hapus saringan</button></>
          )}
        </p>

        {site.link.length === 0 ? (
          <div className="empty-mini">
            <p>Belum ada tautan. Tambahkan tautan pertama supaya papan rambu punya arah.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-mini">
            <p>Tidak ada tautan yang cocok dengan saringan ini.</p>
            <button type="button" className="btn" onClick={() => setF(NO_FILTER)}>Hapus saringan</button>
          </div>
        ) : (
          <ol className="rows">
            {visible.map(({ l, i }, pos) => {
              const k = katOf.get(l.kategori);
              const n = clicks[`l:${l.id}`] ?? 0;
              const onKey = (e: KeyboardEvent) => {
                if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                e.preventDefault();
                move(l, pos, e.key === "ArrowUp" ? -1 : 1);
              };
              return (
                <li key={l.id} className="row" onKeyDown={onKey}>
                  <span className="row-pos" aria-hidden>{i + 1}</span>
                  <div className="row-main">
                    <div className="row-title">
                      <Plate warna={k?.warna} small>{k?.nama ?? "Tanpa kategori"}</Plate>
                      <span className="row-judul">{l.judul}</span>
                    </div>
                    <span className="row-url">{l.url.replace(/^https?:\/\//, "")}</span>
                    <span className="row-tags">
                      {l.utama && <span className="d-tag" data-tone="yellow">Utama</span>}
                      {l.label && <span className="d-tag">{LABEL_NAME[l.label]}{l.labelSampai ? ` s/d ${l.labelSampai}` : ""}</span>}
                      <span className="row-klik"><b>{fmt(n)}</b> klik</span>
                    </span>
                  </div>
                  <div className="row-actions" role="group" aria-label={`Aksi untuk ${l.judul}`}>
                    <button type="button" className="icon-btn" id={`lk-${l.id}-up`} disabled={pos === 0}
                      aria-label={`Naikkan ${l.judul}`} aria-keyshortcuts="Alt+ArrowUp" onClick={() => move(l, pos, -1)}>
                      <ArrowUp size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" id={`lk-${l.id}-down`} disabled={pos === visible.length - 1}
                      aria-label={`Turunkan ${l.judul}`} aria-keyshortcuts="Alt+ArrowDown" onClick={() => move(l, pos, 1)}>
                      <ArrowDown size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" id={`lk-${l.id}-edit`} aria-label={`Ubah ${l.judul}`}
                      onClick={() => setEdit({ mode: "edit", id: l.id })}>
                      <PencilSimple size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Duplikat ${l.judul}`} disabled={full}
                      onClick={() => void duplicate(l)}>
                      <CopySimple size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="icon-btn" data-danger aria-label={`Hapus ${l.judul}`}
                      onClick={() => setDeleting(l)}>
                      <Trash size={18} weight="bold" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {site.link.length > 1 && <p className="field-hint desk-only">Alt + ↑/↓ memindah tautan yang sedang difokus.</p>}
      </section>
      <p className="sr-only" aria-live="polite">{live}</p>

      <LinkForm key={edit?.mode === "edit" ? edit.id : edit ? "add" : "closed"} open={!!edit && (edit.mode === "add" || !!editing)}
        link={editing} site={site} commit={commit} onClose={() => setEdit(null)} />

      <Confirm open={!!deleting} title="Hapus tautan?" confirmLabel="Hapus" danger
        onClose={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)}>
        <p><b>{deleting?.judul}</b> hilang dari halaman publik. Jumlah kliknya tetap tercatat di statistik.</p>
      </Confirm>
    </div>
  );
}

/* ---------- Add / edit form (drawer on desktop, full-screen sheet on phones) ---------- */

type Draft = { judul: string; url: string; kategori: string; catatan: string; utama: boolean; label: string; labelSampai: string };
const FIELDS = ["judul", "url", "kategori", "catatan", "utama", "label", "labelSampai"] as const;

const toDraft = (l: Link | undefined, kategori: string): Draft => ({
  judul: l?.judul ?? "", url: l?.url ?? "", kategori: l?.kategori ?? kategori, catatan: l?.catatan ?? "",
  utama: l?.utama ?? false, label: l?.label ?? "", labelSampai: l?.labelSampai ?? "",
});

/** "instagram.com/x" → "https://instagram.com/x". Leaves mailto:, tel: and full URLs alone. */
const withScheme = (u: string) =>
  u && !/^[a-z][a-z0-9+.-]*:/i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u) ? `https://${u}` : u;

function LinkForm({ open, link, site, commit, onClose }: {
  open: boolean; link: Link | undefined; site: Site; commit: Commit; onClose: () => void;
}) {
  const start = useMemo(() => toDraft(link, site.kategori[0]?.id ?? ""), [link, site.kategori]);
  const [d, setD] = useState(start);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [formError, setFormError] = useState("");
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const id = link?.id ?? "baru";

  const otherUtama = site.link.filter((l) => l.utama && l.id !== link?.id);
  const utamaBlocked = !d.utama && otherUtama.length >= UTAMA_MAX;

  const errors = useMemo(() => {
    const out: Partial<Record<(typeof FIELDS)[number], string>> = {};
    const r = linkSchema.safeParse({ id, ...d, label: d.label || undefined });
    if (!r.success) for (const i of r.error.issues) out[i.path[0] as (typeof FIELDS)[number]] ??= i.message;
    if (!site.kategori.some((k) => k.id === d.kategori)) out.kategori ??= "Pilih kategori";
    if (d.utama && otherUtama.length >= UTAMA_MAX) out.utama = "Sudah ada 2 tautan utama";
    return out;
  }, [d, id, site.kategori, otherUtama.length]);
  const show = (k: (typeof FIELDS)[number]) => (submitted || touched.has(k) ? errors[k] : undefined);
  const set = (patch: Partial<Draft>) => {
    setD((v) => ({ ...v, ...patch }));
    setFormError("");
  };
  const blur = (k: string) => setTouched((t) => (t.has(k) ? t : new Set(t).add(k)));
  const close = () => (dirty && !pending ? setDiscard(true) : onClose());

  async function submit() {
    setSubmitted(true);
    const bad = FIELDS.find((k) => errors[k]);
    if (bad) {
      document.getElementById(`lf-${bad}`)?.focus();
      return;
    }
    const value: Link = linkSchema.parse({ id: link?.id ?? newId(), ...d, label: d.label || undefined });
    setPending(true);
    const r = await commit(
      (s) =>
        link
          ? { ...s, link: s.link.map((l) => (l.id === link.id ? value : l)) }
          : { ...s, link: s.link.some((l) => l.id === value.id) ? s.link : [...s.link, value] },
      { form: true, done: link ? "Tautan diperbarui" : "Tautan ditambahkan" },
    );
    setPending(false);
    if (r.ok) onClose();
    else if (!EXPIRED.test(r.error)) setFormError(r.error);
  }

  const w = (k: (typeof FIELDS)[number], hint?: boolean) => {
    const e = show(k);
    const by = [e && `lf-${k}-err`, hint && `lf-${k}-hint`].filter(Boolean).join(" ");
    return { id: `lf-${k}`, "aria-invalid": e ? true : undefined, "aria-describedby": by || undefined, onBlur: () => blur(k) };
  };

  return (
    <>
      <Modal open={open} onClose={close} variant="drawer" title={link ? "Ubah tautan" : "Tambah tautan"}
        footer={
          <>
            {dirty && <span className="dirty-note"><span className="dirty-dot" aria-hidden />Belum disimpan</span>}
            <button type="button" className="btn" onClick={close}>Batal</button>
            <button type="submit" form="link-form" className="btn btn-primary" disabled={pending || (!!link && !dirty)}>
              {pending ? "Menyimpan…" : link ? "Simpan perubahan" : "Tambah tautan"}
            </button>
          </>
        }>
        <form id="link-form" className="form-grid" noValidate onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}>
          {formError && <p className="form-error" role="alert">Gagal menyimpan: {formError}</p>}
          <LField k="judul" label="Judul" error={show("judul")} hint={`${d.judul.length}/48`}>
            <input {...w("judul", true)} value={d.judul} maxLength={48} autoComplete="off" data-autofocus=""
              onChange={(e) => set({ judul: e.target.value })} />
          </LField>
          <LField k="url" label="Alamat (URL)" error={show("url")} hint="https://, mailto: atau tel:">
            <input {...w("url", true)} type="url" inputMode="url" autoCapitalize="off" spellCheck={false}
              placeholder="https://contoh.com" value={d.url}
              onChange={(e) => set({ url: e.target.value.trim() })}
              onBlur={() => {
                blur("url");
                const fixed = withScheme(d.url);
                if (fixed !== d.url) set({ url: fixed });
              }} />
          </LField>
          <LField k="kategori" label="Kategori" error={show("kategori")}>
            <select {...w("kategori")} value={d.kategori} onChange={(e) => set({ kategori: e.target.value })}>
              {!site.kategori.some((k) => k.id === d.kategori) && <option value={d.kategori}>Pilih kategori</option>}
              {site.kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </LField>
          <LField k="catatan" label="Catatan" error={show("catatan")} hint={`${d.catatan.length}/60 · opsional`}>
            <input {...w("catatan", true)} value={d.catatan} maxLength={60} autoComplete="off"
              placeholder="mis. karya pilihan" onChange={(e) => set({ catatan: e.target.value })} />
          </LField>

          <div className="field">
            <label className="switch">
              <input type="checkbox" role="switch" id="lf-utama" checked={d.utama} disabled={utamaBlocked}
                aria-describedby="lf-utama-hint" onChange={(e) => set({ utama: e.target.checked })} />
              <span>Tautan utama</span>
            </label>
            <p className="field-hint" id="lf-utama-hint">
              {utamaBlocked
                ? `Papan gantry di atas halaman hanya memuat ${UTAMA_MAX} tautan utama: ${otherUtama.map((l) => l.judul).join(" dan ")}. Matikan salah satunya dulu.`
                : `Tampil besar di papan gantry paling atas. Maksimal ${UTAMA_MAX} (${otherUtama.length + (d.utama ? 1 : 0)}/${UTAMA_MAX} terpakai).`}
            </p>
          </div>

          <div className="pair">
            <LField k="label" label="Label" error={show("label")}>
              <select {...w("label")} value={d.label}
                onChange={(e) => set(e.target.value ? { label: e.target.value } : { label: "", labelSampai: "" })}>
                <option value="">Tanpa label</option>
                {LABELS.map((x) => <option key={x} value={x}>{LABEL_NAME[x]}</option>)}
              </select>
            </LField>
            <LField k="labelSampai" label="Label sampai" error={show("labelSampai")} hint="opsional">
              <input {...w("labelSampai", true)} type="date" disabled={!d.label} value={d.labelSampai}
                onChange={(e) => set({ labelSampai: e.target.value })} />
            </LField>
          </div>
        </form>
      </Modal>

      <Confirm open={discard} title="Buang perubahan?" confirmLabel="Buang" danger onClose={() => setDiscard(false)}
        onConfirm={() => {
          setDiscard(false);
          onClose();
        }}>
        <p>Isian di formulir tautan belum disimpan.</p>
      </Confirm>
    </>
  );
}

function LField({ k, label, error, hint, children }: {
  k: string; label: string; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <Field path={k} label={label} error={error} hint={hint} ids={{ input: `lf-${k}`, err: `lf-${k}-err`, hint: `lf-${k}-hint` }}>
      {children}
    </Field>
  );
}

