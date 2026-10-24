"use client";

import { useMemo, useState, type ClipboardEvent, type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction } from "react";
import {
  Archive, ArrowDown, ArrowUUpLeft, ArrowUp, Check, CheckSquare, CopySimple, MagicWand, MagnifyingGlass, PencilSimple, Plus, Star, Trash,
} from "@phosphor-icons/react";
import { fetchTitle } from "@/app/admin/link-actions";
import type { Day } from "@/lib/analytics";
import { LABELS, clockIn, isBaru, isOfficeOnly, lanesOf, linkSchema, linksIn, type Link, type Site } from "@/lib/site";
import { Field, Plate, Segmented, focusLater, insertAt, newId, swap, wire } from "./controls";
import { Confirm, Modal } from "./modal";
import { fmt, span, sum } from "./stats";
import { EXPIRED, sessionExpired, toast } from "./toast";
import { bulkEdit, cleanUrl, destKey, restoreLinks, type BulkOp } from "./url-tools";
import type { Commit } from "./dashboard";
import "./forms.css";

export type LinkEdit = { mode: "add" } | { mode: "edit"; id: string } | null;

const LINK_MAX = 200;
const UTAMA_MAX = 2;
export const LABEL_NAME: Record<(typeof LABELS)[number], string> = { baru: "Baru", populer: "Populer", promo: "Promo" };

/** Today on the owner's clock: the date a new link is stamped with. */
const todayOf = (site: Site) => clockIn(site.status.zona, new Date()).date;

type Filter = { q: string; kat: string; label: string; utama: boolean; arsip: boolean };
const NO_FILTER: Filter = { q: "", kat: "", label: "", utama: false, arsip: false };

type BulkKind = "kategori" | "lain" | "label" | "hapus";
const BULK_TITLE: Record<Exclude<BulkKind, "hapus">, string> = { kategori: "Pindah kategori", lain: "Jalur lain", label: "Beri label" };

export function Tautan({ site, days, commit, edit, setEdit }: {
  site: Site; days: Day[]; commit: Commit; edit: LinkEdit; setEdit: Dispatch<SetStateAction<LinkEdit>>;
}) {
  const [f, setF] = useState<Filter>(NO_FILTER);
  const [deleting, setDeleting] = useState<Link | null>(null);
  const [live, setLive] = useState("");
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [bulk, setBulk] = useState<BulkKind | null>(null);
  const clicks = useMemo(() => sum(days), [days]);
  const today = todayOf(site);
  const recent = useMemo(() => span(days, today, 30), [days, today]);
  const katOf = useMemo(() => new Map(site.kategori.map((k) => [k.id, k])), [site.kategori]);
  const q = f.q.trim().toLocaleLowerCase("id");
  const visible = site.link
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => l.arsip === f.arsip
      && (!f.kat || lanesOf(l).includes(f.kat)) && (!f.label || (f.label === "none" ? !l.label : l.label === f.label))
      && (!f.utama || l.utama) && (!q || `${l.judul} ${l.url} ${l.catatan} ${l.kataKunci}`.toLocaleLowerCase("id").includes(q)));
  const filtered = f.q !== "" || f.kat !== "" || f.label !== "" || f.utama || f.arsip;
  const arsipCount = site.link.filter((l) => l.arsip).length;
  const utamaCount = site.link.filter((l) => l.utama).length;
  const full = site.link.length >= LINK_MAX;
  const noKat = site.kategori.length === 0;
  const editing = edit?.mode === "edit" ? site.link.find((l) => l.id === edit.id) : undefined;
  // Links deleted elsewhere drop out of the selection on their own.
  const sel = site.link.filter((l) => picked.has(l.id));
  const allPicked = visible.length > 0 && visible.every(({ l }) => picked.has(l.id));

  /** One change to the selected links, saved once, with one undo that restores them as they were. */
  async function applyBulk(op: BulkOp, done: string) {
    const ids = new Set(sel.map((l) => l.id));
    const before = site.link.flatMap((link, at) => (ids.has(link.id) ? [{ link, at }] : []));
    const r = await commit((s) => bulkEdit(s, ids, op));
    if (!r.ok) return;
    setBulk(null);
    setPicked(new Set());
    setLive(done);
    focusLater("lk-pick");
    toast.undo(done, () => void commit((s) => restoreLinks(s, before), { done: "Perubahan diurungkan" }));
  }

  async function toggleArsip(l: Link, pos: number) {
    const at = site.link.findIndex((x) => x.id === l.id);
    const r = await commit((s) => bulkEdit(s, new Set([l.id]), { kind: "arsip", arsip: !l.arsip }));
    if (!r.ok) return;
    // The row leaves this view; keep focus in the list.
    const next = visible[pos + 1] ?? visible[pos - 1];
    focusLater(...(next ? [`lk-${next.l.id}-arsip`] : []), "lk-add");
    const done = l.arsip ? `${l.judul} dipulihkan dari arsip` : l.utama ? `${l.judul} diarsipkan, tidak lagi utama` : `${l.judul} diarsipkan`;
    toast.undo(done, () => void commit((s) => restoreLinks(s, [{ link: l, at }]), { done: "Perubahan diurungkan" }));
  }

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
    const copy: Link = { ...l, id: newId(), judul: `${l.judul} (salinan)`.slice(0, 48), utama: false, dibuat: todayOf(site) };
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
          {site.link.length > 0 && (
            <button type="button" className="btn" id="lk-pick" aria-pressed={picking}
              onClick={() => {
                setPicking((p) => !p);
                setPicked(new Set());
              }}>
              <CheckSquare size={18} weight={picking ? "fill" : "bold"} aria-hidden />
              {picking ? "Selesai memilih" : "Pilih"}
            </button>
          )}
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
            <input type="search" aria-label="Cari tautan" placeholder="Cari judul, alamat, kata kunci" value={f.q}
              onChange={(e) => setF((v) => ({ ...v, q: e.target.value }))} />
          </div>
          <select aria-label="Saring kategori" value={f.kat} onChange={(e) => setF((v) => ({ ...v, kat: e.target.value }))}>
            <option value="">Semua kategori</option>
            {site.kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama} ({linksIn(site, k.id).length})</option>
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
          <button type="button" className="chip" aria-pressed={f.arsip} onClick={() => setF((v) => ({ ...v, arsip: !v.arsip, utama: false }))}>
            <Archive size={18} weight={f.arsip ? "fill" : "bold"} aria-hidden />
            Arsip ({arsipCount})
          </button>
        </div>
        <p className="field-hint" aria-live="polite">
          {f.arsip
            ? <>{visible.length} dari {arsipCount} tautan arsip · tidak tampil di halaman publik</>
            : <>{visible.length} dari {site.link.length - arsipCount} tautan · {utamaCount}/{UTAMA_MAX} utama</>}
          {filtered && (
            <> · <button type="button" className="text-btn" onClick={() => setF(NO_FILTER)}>Hapus saringan</button></>
          )}
        </p>

        {picking && visible.length > 0 && (
          <div className="pick-tools">
            <button type="button" className="btn btn-quiet"
              onClick={() => setPicked(allPicked
                ? new Set([...picked].filter((x) => !visible.some(({ l }) => l.id === x)))
                : new Set([...picked, ...visible.map(({ l }) => l.id)]))}>
              {allPicked ? `Batal pilih yang tampil (${visible.length})` : `Pilih semua yang tampil (${visible.length})`}
            </button>
            {sel.length > 0 && (
              <button type="button" className="text-btn" onClick={() => setPicked(new Set())}>Kosongkan pilihan</button>
            )}
          </div>
        )}

        {site.link.length === 0 ? (
          <div className="empty-mini">
            <p>Belum ada tautan. Tambahkan tautan pertama supaya papan rambu punya arah.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-mini">
            <p>{f.arsip && !arsipCount ? "Arsip kosong. Tautan yang diarsipkan disimpan di sini, tidak tampil di halaman publik." : "Tidak ada tautan yang cocok dengan saringan ini."}</p>
            <button type="button" className="btn" onClick={() => setF(NO_FILTER)}>{f.arsip && !arsipCount ? "Kembali ke daftar" : "Hapus saringan"}</button>
          </div>
        ) : (
          <ol className="rows" data-picking={picking || undefined}>
            {visible.map(({ l, i }, pos) => {
              const k = katOf.get(l.kategori);
              const n = clicks[`l:${l.id}`] ?? 0;
              const onKey = (e: KeyboardEvent) => {
                if (picking || !e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                e.preventDefault();
                move(l, pos, e.key === "ArrowUp" ? -1 : 1);
              };
              return (
                <li key={l.id} className="row" onKeyDown={onKey} data-arsip={l.arsip || undefined}>
                  {picking ? (
                    <label className="row-pick">
                      <input type="checkbox" checked={picked.has(l.id)} aria-label={`Pilih ${l.judul}`}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setPicked((p) => {
                            const s = new Set(p);
                            if (on) s.add(l.id);
                            else s.delete(l.id);
                            return s;
                          });
                        }} />
                    </label>
                  ) : (
                    <span className="row-pos" aria-hidden>{i + 1}</span>
                  )}
                  <div className="row-main">
                    <div className="row-title">
                      <Plate warna={k?.warna} ikon={k?.ikon} small>{k?.nama ?? "Tanpa kategori"}</Plate>
                      {l.kategoriLain.length > 0 && (
                        <span className="row-lain">
                          <span className="sr-only">juga di</span>
                          {l.kategoriLain.map((id) => katOf.get(id)).map((x) => x && (
                            <Plate key={x.id} warna={x.warna} ikon={x.ikon} small>{x.nama}</Plate>
                          ))}
                        </span>
                      )}
                      <span className="row-judul">{l.judul}</span>
                    </div>
                    <span className="row-url">{l.url.replace(/^https?:\/\//, "")}</span>
                    <span className="row-tags">
                      {l.arsip && <span className="d-tag" data-tone="arsip">Arsip</span>}
                      {l.utama && <span className="d-tag" data-tone="yellow">Utama</span>}
                      {l.label && <span className="d-tag">{LABEL_NAME[l.label]}{l.labelSampai ? ` s/d ${l.labelSampai}` : ""}</span>}
                      <span className="row-klik"><b>{fmt(n)}</b> klik</span>
                      <Spark values={recent.map((d) => d.counts[`l:${l.id}`] ?? 0)} />
                    </span>
                  </div>
                  {!picking && <div className="row-actions" role="group" aria-label={`Aksi untuk ${l.judul}`}>
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
                    <button type="button" className="icon-btn" id={`lk-${l.id}-arsip`}
                      aria-label={l.arsip ? `Pulihkan ${l.judul} dari arsip` : `Arsipkan ${l.judul}`}
                      title={l.arsip ? "Pulihkan dari arsip" : "Arsipkan"} onClick={() => void toggleArsip(l, pos)}>
                      {l.arsip ? <ArrowUUpLeft size={18} weight="bold" aria-hidden /> : <Archive size={18} weight="bold" aria-hidden />}
                    </button>
                    <button type="button" className="icon-btn" data-danger aria-label={`Hapus ${l.judul}`}
                      onClick={() => setDeleting(l)}>
                      <Trash size={18} weight="bold" aria-hidden />
                    </button>
                  </div>}
                </li>
              );
            })}
          </ol>
        )}
        {site.link.length > 1 && !picking && <p className="field-hint desk-only">Alt + ↑/↓ memindah tautan yang sedang difokus.</p>}

        {picking && sel.length > 0 && (
          <div className="bulk-bar" role="toolbar" aria-label={`Edit massal, ${sel.length} tautan dipilih`}>
            <p className="bulk-count"><b>{sel.length}</b> dipilih</p>
            <button type="button" className="btn" onClick={() => setBulk("kategori")}>Pindah kategori</button>
            {site.kategori.length > 1 && <button type="button" className="btn" onClick={() => setBulk("lain")}>Jalur lain</button>}
            <button type="button" className="btn" onClick={() => setBulk("label")}>Beri label</button>
            {sel.some((l) => !l.arsip) && (
              <button type="button" className="btn" onClick={() => void applyBulk({ kind: "arsip", arsip: true }, `${sel.filter((l) => !l.arsip).length} tautan diarsipkan`)}>
                <Archive size={18} weight="bold" aria-hidden />
                Arsipkan
              </button>
            )}
            {sel.some((l) => l.arsip) && (
              <button type="button" className="btn" onClick={() => void applyBulk({ kind: "arsip", arsip: false }, `${sel.filter((l) => l.arsip).length} tautan dipulihkan`)}>
                <ArrowUUpLeft size={18} weight="bold" aria-hidden />
                Pulihkan
              </button>
            )}
            <button type="button" className="btn" data-danger onClick={() => setBulk("hapus")}>
              <Trash size={18} weight="bold" aria-hidden />
              Hapus
            </button>
          </div>
        )}
      </section>
      <p className="sr-only" aria-live="polite">{picking ? `${sel.length} tautan dipilih. ${live}` : live}</p>

      <LinkForm key={edit?.mode === "edit" ? edit.id : edit ? "add" : "closed"} open={!!edit && (edit.mode === "add" || !!editing)}
        link={editing} site={site} commit={commit} onClose={() => setEdit(null)} onOpen={(id) => setEdit({ mode: "edit", id })} />

      <Confirm open={!!deleting} title="Hapus tautan?" confirmLabel="Hapus" danger
        onClose={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)}>
        <p><b>{deleting?.judul}</b> hilang dari halaman publik. Jumlah kliknya tetap tercatat di statistik.</p>
        {!deleting?.arsip && <p className="field-hint">Mungkin dipakai lagi nanti? Arsipkan saja: tersembunyi dari pengunjung, bisa dipulihkan.</p>}
      </Confirm>

      <Confirm open={bulk === "hapus"} title={`Hapus ${sel.length} tautan?`} confirmLabel={`Hapus ${sel.length} tautan`} danger
        onClose={() => setBulk(null)} onConfirm={() => void applyBulk({ kind: "hapus" }, `${sel.length} tautan dihapus`)}>
        <p>{sel.slice(0, 5).map((l) => l.judul).join(", ")}{sel.length > 5 && `, dan ${sel.length - 5} lainnya`} hilang dari halaman publik. Jumlah kliknya tetap tercatat.</p>
      </Confirm>

      {bulk && bulk !== "hapus" && (
        <BulkForm kind={bulk} count={sel.length} site={site} onClose={() => setBulk(null)} onApply={applyBulk} />
      )}
    </div>
  );
}

/** 30 days of taps for one link: a tiny line, last day dotted. No axes; the number sits in the label. */
function Spark({ values }: { values: number[] }) {
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [2 + (i * 60) / (values.length - 1), 16 - (v / max) * 13] as const);
  const [lx, ly] = pts[pts.length - 1]!;
  return (
    <svg className="spark" viewBox="0 0 64 18" width="64" height="18" role="img" aria-label={`${fmt(total)} klik dalam 30 hari`}>
      <polyline points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} />
      <circle cx={lx} cy={ly} r="2.5" />
    </svg>
  );
}

/** The few fields one bulk action needs: target category, extra lane (add or remove), or label + until. */
function BulkForm({ kind, count, site, onClose, onApply }: {
  kind: Exclude<BulkKind, "hapus">; count: number; site: Site; onClose: () => void; onApply: (op: BulkOp, done: string) => Promise<void>;
}) {
  const [kat, setKat] = useState(site.kategori[0]?.id ?? "");
  const [add, setAdd] = useState<"tambah" | "hapus">("tambah");
  const [label, setLabel] = useState("");
  const [sampai, setSampai] = useState("");
  const [pending, setPending] = useState(false);
  const nama = site.kategori.find((k) => k.id === kat)?.nama ?? kat;

  async function submit() {
    setPending(true);
    const lbl = label as Link["label"] | "";
    await onApply(
      kind === "kategori" ? { kind, kategori: kat }
        : kind === "lain" ? { kind, kategori: kat, add: add === "tambah" }
        : { kind, label: lbl || undefined, sampai },
      kind === "kategori" ? `${count} tautan dipindah ke ${nama}`
        : kind === "lain" ? `Jalur ${nama} ${add === "tambah" ? "ditambahkan ke" : "dilepas dari"} ${count} tautan`
        : lbl ? `${count} tautan diberi label ${LABEL_NAME[lbl]}` : `Label dilepas dari ${count} tautan`,
    );
    setPending(false);
  }

  return (
    <Modal open onClose={onClose} title={BULK_TITLE[kind]}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" form="bulk-form" className="btn btn-primary" disabled={pending}>
            {pending ? "Menyimpan…" : `Terapkan ke ${count} tautan`}
          </button>
        </>
      }>
      <form id="bulk-form" className="form-grid" noValidate onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}>
        {kind === "lain" && (
          <Segmented name="bulk-lain" label="Jalur lain" value={add} onChange={setAdd}
            options={[{ value: "tambah", label: "Tambahkan" }, { value: "hapus", label: "Lepaskan" }]} />
        )}
        {kind !== "label" ? (
          <Field path="bulk.kat" label={kind === "kategori" ? "Kategori tujuan" : "Jalur"}
            hint={kind === "lain" ? "tautan yang kategori utamanya ini tidak berubah" : undefined}>
            <select {...wire("bulk.kat", undefined, kind === "lain")} value={kat} data-autofocus="" onChange={(e) => setKat(e.target.value)}>
              {site.kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </Field>
        ) : (
          <div className="pair">
            <Field path="bulk.label" label="Label">
              <select {...wire("bulk.label")} value={label} data-autofocus="" onChange={(e) => {
                setLabel(e.target.value);
                if (!e.target.value) setSampai("");
              }}>
                <option value="">Tanpa label</option>
                {LABELS.map((x) => <option key={x} value={x}>{LABEL_NAME[x]}</option>)}
              </select>
            </Field>
            <Field path="bulk.sampai" label="Label sampai" hint="opsional">
              <input {...wire("bulk.sampai", undefined, true)} type="date" disabled={!label} value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </Field>
          </div>
        )}
      </form>
    </Modal>
  );
}

/* ---------- Add / edit form (drawer on desktop, full-screen sheet on phones) ---------- */

type Draft = {
  judul: string; url: string; kategori: string; kategoriLain: string[]; catatan: string; kataKunci: string; panduan: string;
  utama: boolean; label: string; labelSampai: string;
};
const FIELDS = ["judul", "url", "kategori", "kategoriLain", "catatan", "kataKunci", "panduan", "utama", "label", "labelSampai"] as const;

const toDraft = (l: Link | undefined, kategori: string): Draft => ({
  judul: l?.judul ?? "", url: l?.url ?? "", kategori: l?.kategori ?? kategori, kategoriLain: l?.kategoriLain ?? [],
  catatan: l?.catatan ?? "", kataKunci: l?.kataKunci ?? "", panduan: l?.panduan ?? "",
  utama: l?.utama ?? false, label: l?.label ?? "", labelSampai: l?.labelSampai ?? "",
});

/** "2026-10-28" → "28 Okt 2026". */
const tanggal = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const plusDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

function LinkForm({ open, link, site, commit, onClose, onOpen }: {
  open: boolean; link: Link | undefined; site: Site; commit: Commit; onClose: () => void; onOpen: (id: string) => void;
}) {
  const start = useMemo(() => toDraft(link, site.kategori[0]?.id ?? ""), [link, site.kategori]);
  const [d, setD] = useState(start);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [formError, setFormError] = useState("");
  // URL cleaning (#1): what was pasted, so the admin can take it back; and a raw URL they chose to keep.
  const [tidy, setTidy] = useState<{ raw: string; changes: string[] } | null>(null);
  const [keepRaw, setKeepRaw] = useState("");
  const [dupOk, setDupOk] = useState("");
  const [title, setTitle] = useState<{ busy?: boolean; msg: string; err?: boolean }>({ msg: "" });
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const id = link?.id ?? "baru";
  const today = todayOf(site);
  // Stamped once when the link is made; editing never moves it.
  const dibuat = link ? link.dibuat : today;
  const baru = isBaru({ dibuat } as Link, today);
  const office = isOfficeOnly(d.url);
  const arsip = !!link?.arsip;

  const otherUtama = site.link.filter((l) => l.utama && l.id !== link?.id);
  const utamaBlocked = !d.utama && otherUtama.length >= UTAMA_MAX;

  // Same destination as another link, archived ones included (#1). A warning only; "Tetap tambah" hides it.
  const keys = useMemo(() => site.link.map((l) => [destKey(l.url), l] as const), [site.link]);
  const dupKey = d.url ? destKey(d.url) : "";
  const dup = dupKey && dupKey !== dupOk ? keys.find(([k, l]) => k === dupKey && l.id !== link?.id)?.[1] : undefined;
  const canFetch = /^https?:\/\/[^/?#]+\.[^/?#]+/i.test(d.url);

  const errors = useMemo(() => {
    const out: Partial<Record<(typeof FIELDS)[number], string>> = {};
    const r = linkSchema.safeParse({ id, ...d, label: d.label || undefined });
    if (!r.success) for (const i of r.error.issues) out[i.path[0] as (typeof FIELDS)[number]] ??= i.message;
    if (!site.kategori.some((k) => k.id === d.kategori)) out.kategori ??= "Pilih kategori";
    if (d.utama && otherUtama.length >= UTAMA_MAX) out.utama = "Sudah ada 2 tautan utama";
    if (d.utama && arsip) out.utama = "Tautan arsip tidak bisa jadi tautan utama";
    return out;
  }, [d, id, site.kategori, otherUtama.length, arsip]);
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
    const value: Link = linkSchema.parse({ id: link?.id ?? newId(), ...d, label: d.label || undefined, dibuat, arsip });
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

  const w = (k: (typeof FIELDS)[number], hint?: boolean, more?: string | false) => {
    const e = show(k);
    const by = [e && `lf-${k}-err`, hint && `lf-${k}-hint`, more].filter(Boolean).join(" ");
    return { id: `lf-${k}`, "aria-invalid": e ? true : undefined, "aria-describedby": by || undefined, onBlur: () => blur(k) };
  };

  function tidyUrl(raw: string) {
    const r = cleanUrl(raw);
    if (r.url === raw || raw === keepRaw) return;
    set({ url: r.url });
    setTidy({ raw, changes: r.changes });
  }

  // Pasting over the whole box cleans at once; a paste into the middle is cleaned on blur.
  function paste(e: ClipboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    if (el.value && !(el.selectionStart === 0 && el.selectionEnd === el.value.length)) return;
    e.preventDefault();
    const raw = e.clipboardData.getData("text");
    set({ url: raw.trim() });
    tidyUrl(raw.trim());
  }

  async function ambilJudul() {
    setTitle({ busy: true, msg: "Mengambil judul…" });
    try {
      const r = await fetchTitle(d.url);
      if (r.ok) {
        const note = r.catatan && !d.catatan.trim();
        set(note ? { judul: r.judul, catatan: r.catatan } : { judul: r.judul });
        setTitle({ msg: note ? `Judul diisi dari halaman. Catatan: ${r.catatan}.` : "Judul diisi dari halaman." });
      } else if (EXPIRED.test(r.error)) {
        setTitle({ msg: "" });
        sessionExpired(() => void ambilJudul());
      } else setTitle({ msg: `${r.error}.`, err: true });
    } catch {
      setTitle({ msg: "Server tidak terjangkau. Coba lagi.", err: true });
    }
  }

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
          {arsip && (
            <p className="lf-arsip">
              <span className="d-tag" data-tone="arsip">Arsip</span>{" "}
              Tautan ini di arsip: tersimpan di sini, tapi tidak tampil di halaman publik. Pulihkan dari daftar tautan.
            </p>
          )}
          <LField k="judul" label="Judul" error={show("judul")} hint={`${d.judul.length}/48`}>
            <div className="lf-judul">
              <input {...w("judul", true, "lf-judul-note")} value={d.judul} maxLength={48} autoComplete="off" data-autofocus=""
                onChange={(e) => set({ judul: e.target.value })} />
              <button type="button" className="btn" disabled={!canFetch || title.busy} aria-describedby="lf-judul-note"
                title={canFetch ? "Ambil judul dari halaman di alamat URL" : "Isi alamat https:// dulu"} onClick={() => void ambilJudul()}>
                <MagicWand size={18} weight="bold" aria-hidden />
                {title.busy ? "Mengambil…" : "Ambil judul"}
              </button>
            </div>
            <p className="lf-note" id="lf-judul-note" aria-live="polite" data-error={title.err || undefined}>
              {title.msg || (!canFetch && !d.judul ? "Isi alamat di bawah, lalu Ambil judul untuk mengisinya otomatis." : "")}
            </p>
          </LField>
          <LField k="url" label="Alamat (URL)" error={show("url")} hint="https://, mailto: atau tel:">
            <input {...w("url", true, [office && "lf-url-office", tidy && "lf-url-tidy", dup && "lf-url-dup"].filter(Boolean).join(" "))}
              type="url" inputMode="url" autoCapitalize="off" spellCheck={false}
              placeholder="https://contoh.com" value={d.url}
              onPaste={paste}
              onChange={(e) => {
                set({ url: e.target.value.trim() });
                setTidy(null);
              }}
              onBlur={() => {
                blur("url");
                tidyUrl(d.url);
              }} />
            <div className="lf-notes" aria-live="polite">
              {tidy && (
                <p className="lf-note" id="lf-url-tidy">
                  URL dirapikan: {tidy.changes.join(", ")}.{" "}
                  <button type="button" className="text-btn" onClick={() => {
                    setKeepRaw(tidy.raw);
                    set({ url: tidy.raw });
                    setTidy(null);
                  }}>Urungkan</button>
                </p>
              )}
              {dup && (
                <p className="lf-note lf-dup" id="lf-url-dup">
                  <span>
                    Link ini sudah ada: <b>{dup.judul}</b> ({lanesOf(dup).map((x) => site.kategori.find((k) => k.id === x)?.nama ?? x).join(", ")})
                    {dup.arsip && <> · <span className="d-tag" data-tone="arsip">Arsip</span></>}
                  </span>
                  <span className="lf-dup-actions">
                    <button type="button" className="text-btn" onClick={() => onOpen(dup.id)}>Buka</button>
                    <button type="button" className="text-btn" onClick={() => setDupOk(dupKey)}>{link ? "Biarkan" : "Tetap tambah"}</button>
                  </span>
                </p>
              )}
            </div>
            <p className="lf-office" aria-live="polite">
              {office && (
                <span id="lf-url-office">
                  <span className="d-tag" data-tone="yellow">Jaringan kantor</span>{" "}
                  Link ini hanya bisa dibuka dari jaringan kantor; pengunjung melihat tanda Jaringan kantor.
                </span>
              )}
            </p>
          </LField>
          <LField k="kategori" label="Kategori" error={show("kategori")}>
            <select {...w("kategori")} value={d.kategori}
              onChange={(e) => set({ kategori: e.target.value, kategoriLain: d.kategoriLain.filter((x) => x !== e.target.value) })}>
              {!site.kategori.some((k) => k.id === d.kategori) && <option value={d.kategori}>Pilih kategori</option>}
              {site.kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </LField>
          {site.kategori.length > 1 && (
            <fieldset className="field" aria-describedby="lf-kategoriLain-hint">
              <div className="field-head">
                <legend>Jalur lain</legend>
                <span className="field-hint" id="lf-kategoriLain-hint">opsional</span>
              </div>
              <div className="lanes">
                {site.kategori.filter((k) => k.id !== d.kategori).map((k, i) => {
                  const on = d.kategoriLain.includes(k.id);
                  return (
                    <label key={k.id} className="lane-toggle">
                      <input type="checkbox" id={i === 0 ? "lf-kategoriLain" : undefined} checked={on}
                        onChange={() => set({
                          // Keep the lanes in category order, whatever order they were ticked in.
                          kategoriLain: site.kategori.map((x) => x.id)
                            .filter((x) => x !== d.kategori && (x === k.id ? !on : d.kategoriLain.includes(x))),
                        })} />
                      <Plate warna={k.warna} ikon={k.ikon}>
                        {k.nama}
                        {on && <Check size={16} weight="bold" aria-hidden />}
                      </Plate>
                    </label>
                  );
                })}
              </div>
              {show("kategoriLain") && <p className="field-error">{show("kategoriLain")}</p>}
            </fieldset>
          )}
          <LField k="catatan" label="Catatan" error={show("catatan")} hint={`${d.catatan.length}/60 · opsional`}>
            <input {...w("catatan", true)} value={d.catatan} maxLength={60} autoComplete="off"
              placeholder="mis. Google Form" onChange={(e) => set({ catatan: e.target.value })} />
          </LField>
          <LField k="kataKunci" label="Kata kunci pencarian" error={show("kataKunci")} hint="mis. apd, helm, sepatu">
            <input {...w("kataKunci", true)} value={d.kataKunci} maxLength={120} autoComplete="off" autoCapitalize="off"
              placeholder="pisahkan dengan koma" onChange={(e) => set({ kataKunci: e.target.value })} />
          </LField>
          <LField k="panduan" label="Panduan singkat" error={show("panduan")}
            hint={<><span aria-live="polite">{d.panduan.length}/280</span> · tampil di tombol ⓘ</>}>
            <textarea {...w("panduan", true)} value={d.panduan} maxLength={280} rows={3}
              placeholder="mis. Login pakai NRP, lalu pilih menu Absensi." onChange={(e) => set({ panduan: e.target.value })} />
          </LField>

          <div className="field">
            <label className="switch">
              <input type="checkbox" role="switch" id="lf-utama" checked={d.utama} disabled={(utamaBlocked || arsip) && !d.utama}
                aria-describedby="lf-utama-hint" onChange={(e) => set({ utama: e.target.checked })} />
              <span>Tautan utama</span>
            </label>
            {show("utama") && <p className="field-error">{show("utama")}</p>}
            <p className="field-hint" id="lf-utama-hint">
              {arsip
                ? "Tautan arsip tidak bisa jadi tautan utama. Pulihkan dulu dari arsip di daftar tautan."
                : utamaBlocked
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
          {baru && !d.label && <p className="field-hint">Label BARU otomatis sampai {tanggal(plusDays(dibuat!, 6))}.</p>}
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
  k: string; label: string; error?: string; hint?: ReactNode; children: ReactNode;
}) {
  return (
    <Field path={k} label={label} error={error} hint={hint} ids={{ input: `lf-${k}`, err: `lf-${k}-err`, hint: `lf-${k}-hint` }}>
      {children}
    </Field>
  );
}

