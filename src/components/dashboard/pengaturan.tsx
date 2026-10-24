"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowClockwise, ArrowCounterClockwise, ClockCounterClockwise, CopySimple, DownloadSimple, FileCsv, Key, QrCode, SignOut, UploadSimple,
} from "@phosphor-icons/react";
import { changePassword, logout } from "@/app/actions";
import { listHistory, resetStats, restoreVersion, type VersionInfo } from "@/app/admin/actions";
import { fetchSheetCsv } from "@/app/admin/link-actions";
import { ZONA, clockIn, siteSchema, type Site } from "@/lib/site";
import { Field, Segmented, copyText, download, newId, publicUrl, wire } from "./controls";
import { importRows, parseCsv, type ImportRow } from "./url-tools";
import { Confirm } from "./modal";
import { EXPIRED, sessionExpired, toast } from "./toast";
import { ago } from "./stats";
import type { Commit } from "./dashboard";
import "./insight.css";
import "./forms.css";

/** "link.3.url" → "tautan ke-4, kolom url": where in the file the problem is, in words. */
function where(path: PropertyKey[]): string {
  const [a, b, c] = path;
  const name: Record<string, string> = { link: "tautan", kategori: "kategori", teksBerjalan: "teks berjalan" };
  if (typeof b === "number" && typeof a === "string") return `${name[a] ?? a} ke-${b + 1}${c !== undefined ? `, kolom ${String(c)}` : ""}`;
  return path.map(String).join(".") || "berkas";
}

export function Pengaturan({ site, commit, unsaved, onLogout, onStatsReset, onRestored }: {
  site: Site; commit: Commit; unsaved: boolean; onLogout: () => void; onStatsReset: () => void;
  onRestored: (s: Site) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [importErr, setImportErr] = useState("");
  const [incoming, setIncoming] = useState<{ name: string; site: Site } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState<"" | "reset" | "import" | "qr">("");

  function exportJson() {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`rambu-config-${stamp}.json`, new Blob([JSON.stringify(site, null, 2)], { type: "application/json" }));
    toast.success("Konfigurasi diunduh");
  }

  async function readImport(f: File) {
    setImportErr("");
    let raw: unknown;
    try {
      if (f.size > 1_000_000) throw new Error("size");
      raw = JSON.parse(await f.text());
    } catch (e) {
      const msg = (e as Error).message === "size" ? "Berkas lebih dari 1 MB" : "Berkas bukan JSON yang valid";
      setImportErr(msg);
      toast.error(`Gagal mengimpor: ${msg}.`);
      return;
    }
    const r = siteSchema.safeParse(raw);
    if (!r.success) {
      const i = r.error.issues[0]!;
      const msg = `${where(i.path)}: ${i.message}`;
      setImportErr(msg);
      toast.error(`Gagal mengimpor: ${msg}.`);
      return;
    }
    setIncoming({ name: f.name, site: r.data });
  }

  async function applyImport() {
    if (!incoming) return;
    setBusy("import");
    const r = await commit(() => incoming.site, { done: "Konfigurasi diimpor" });
    setBusy("");
    if (r.ok) setIncoming(null);
  }

  async function doReset() {
    setBusy("reset");
    try {
      const r = await resetStats();
      if (r.ok) {
        onStatsReset();
        setResetting(false);
        toast.success("Statistik direset");
      } else if (EXPIRED.test(r.error)) sessionExpired(() => void doReset());
      else toast.error(`Gagal mereset statistik: ${r.error} Coba lagi.`);
    } catch {
      toast.error("Gagal mereset statistik: server tidak terjangkau. Coba lagi.", [{ label: "Coba lagi", onClick: () => void doReset() }]);
    } finally {
      setBusy("");
    }
  }

  async function qr() {
    setBusy("qr");
    try {
      const { toDataURL } = await import("qrcode");
      const url = await toDataURL(publicUrl(), { width: 1024, margin: 2, errorCorrectionLevel: "M" });
      download("rambu-qr.png", url);
      toast.success("Kode QR diunduh");
    } catch {
      toast.error("Gagal membuat kode QR. Coba lagi.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="sec">
      <div className="sec-head">
        <h2 className="plate-h" data-warna="white" id="sec-pengaturan" tabIndex={-1}>Pengaturan</h2>
      </div>

      <section className="panel" aria-labelledby="set-public">
        <h3 className="panel-title" id="set-public">Halaman publik</h3>
        <div className="field">
          <label className="switch">
            <input type="checkbox" role="switch" checked={site.tampilKlik} aria-describedby="set-klik-hint"
              onChange={(e) => {
                const on = e.target.checked;
                void commit((s) => ({ ...s, tampilKlik: on }), {
                  done: on ? "Jumlah klik ditampilkan" : "Jumlah klik disembunyikan",
                });
              }} />
            <span>Tampilkan jumlah klik di halaman publik</span>
          </label>
          <p className="field-hint" id="set-klik-hint">Angka klik sepanjang waktu muncul di tiap rambu. Statistik tetap tercatat walau disembunyikan.</p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => copyText(publicUrl(), "Tautan halaman disalin")}>
            <CopySimple size={18} weight="bold" aria-hidden />
            Salin tautan halaman
          </button>
          <button type="button" className="btn" onClick={() => void qr()} disabled={busy === "qr"}>
            <QrCode size={18} weight="bold" aria-hidden />
            {busy === "qr" ? "Membuat QR…" : "Unduh kode QR"}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="set-data">
        <h3 className="panel-title" id="set-data">Cadangan konfigurasi</h3>
        <p className="field-hint">Simpan semua isi halaman (profil, kategori, tautan) sebagai berkas JSON, atau pulihkan dari berkas itu.</p>
        <div className="row-actions">
          <button type="button" className="btn" onClick={exportJson}>
            <DownloadSimple size={18} weight="bold" aria-hidden />
            Ekspor JSON
          </button>
          <button type="button" className="btn" onClick={() => file.current?.click()} aria-describedby={importErr ? "imp-err" : undefined}>
            <UploadSimple size={18} weight="bold" aria-hidden />
            Impor JSON
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void readImport(f);
            }} />
        </div>
        {importErr && <p className="field-error" id="imp-err">Berkas ditolak. {importErr}.</p>}
      </section>

      <ImporCsv site={site} commit={commit} />

      <Riwayat site={site} unsaved={unsaved} onRestored={onRestored} />

      <section className="panel" aria-labelledby="set-stats">
        <h3 className="panel-title" id="set-stats">Statistik</h3>
        <p className="field-hint">Menghapus semua angka kunjungan dan klik. Tautan dan pengaturan tidak berubah.</p>
        <div className="row-actions">
          <button type="button" className="btn" data-danger onClick={() => setResetting(true)}>
            <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
            Reset statistik
          </button>
        </div>
      </section>

      <GantiPassword />

      <section className="panel" aria-labelledby="set-akun">
        <h3 className="panel-title" id="set-akun">Sesi</h3>
        <form action={logout} className="row-actions">
          <button type="submit" className="btn" onClick={(e) => {
            if (unsaved) {
              e.preventDefault();
              onLogout();
            }
          }}>
            <SignOut size={18} weight="bold" aria-hidden />
            Keluar
          </button>
        </form>
      </section>

      <Confirm open={!!incoming} title="Ganti seluruh isi halaman?" confirmLabel="Ganti dengan berkas ini" danger
        pending={busy === "import"} onClose={() => setIncoming(null)} onConfirm={() => void applyImport()}>
        <p>
          <b>{incoming?.name}</b> berisi {incoming?.site.link.length} tautan dan {incoming?.site.kategori.length} kategori
          untuk “{incoming?.site.profil.nama}”. Isi sekarang ({site.link.length} tautan, {site.kategori.length} kategori) akan diganti.
        </p>
        <p className="field-hint">Ekspor dulu kalau ingin menyimpan isi sekarang.</p>
      </Confirm>

      <Confirm open={resetting} title="Reset statistik?" confirmLabel="Reset statistik" danger typed="RESET"
        pending={busy === "reset"} onClose={() => setResetting(false)} onConfirm={() => void doReset()}>
        <p>Semua angka kunjungan dan klik dihapus permanen. Ini tidak bisa diurungkan.</p>
      </Confirm>
    </div>
  );
}

/* ---------- Links from CSV / Google Sheets (#32) ---------- */

type Sumber = "tempel" | "berkas" | "sheets";
const STATUS_NAME: Record<ImportRow["status"], string> = { baru: "Baru", duplikat: "Duplikat", error: "Error" };
const LINK_MAX = 200;

function ImporCsv({ site, commit }: { site: Site; commit: Commit }) {
  const file = useRef<HTMLInputElement>(null);
  const [sumber, setSumber] = useState<Sumber>("tempel");
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [skipDup, setSkipDup] = useState(true);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState<"" | "sheet" | "import">("");

  function read(csv: string) {
    const r = importRows(parseCsv(csv), site, clockIn(site.status.zona, new Date()).date, newId);
    setError(r.error ? `${r.error}.` : r.rows.length ? "" : "Tidak ada baris tautan di bawah baris judul kolom.");
    setRows(r.error || !r.rows.length ? null : r.rows);
    if (!r.error && r.rows.length) requestAnimationFrame(() => document.getElementById("csv-preview")?.focus());
  }

  async function readFile(f: File) {
    if (f.size > 1_000_000) return setError("Berkas lebih dari 1 MB.");
    read(await f.text());
  }

  async function readSheet() {
    setBusy("sheet");
    setError("");
    try {
      const r = await fetchSheetCsv(sheet);
      if (r.ok) read(r.text);
      else if (EXPIRED.test(r.error)) sessionExpired(() => void readSheet());
      else setError(`${r.error.replace(/\.$/, "")}.`);
    } catch {
      setError("Server tidak terjangkau. Coba lagi.");
    } finally {
      setBusy("");
    }
  }

  const take = rows?.filter((r) => r.status === "baru" || (r.status === "duplikat" && !skipDup)) ?? [];
  const count = (s: ImportRow["status"]) => rows?.filter((r) => r.status === s).length ?? 0;
  const unknown = [...new Set(take.filter((r) => !r.link.kategori).map((r) => r.katRaw || "(kosong)"))];
  const over = site.link.length + take.length > LINK_MAX;
  const katName = (id: string) => site.kategori.find((k) => k.id === id)?.nama ?? id;

  async function doImport() {
    if (!take.length || (unknown.length && !target) || over) return;
    setBusy("import");
    const links = take.map((r) => (r.link.kategori ? r.link : { ...r.link, kategori: target }));
    const r = await commit((s) => ({ ...s, link: [...s.link, ...links.filter((l) => !s.link.some((x) => x.id === l.id))] }));
    setBusy("");
    if (!r.ok) return;
    const skipped = [count("duplikat") && skipDup && `${count("duplikat")} duplikat dilewati`, count("error") && `${count("error")} error dilewati`];
    toast.success([`${links.length} tautan diimpor`, ...skipped.filter(Boolean)].join(" · "));
    setRows(null);
    setText("");
    setSheet("");
  }

  return (
    <section className="panel" aria-labelledby="set-csv">
      <h3 className="panel-title" id="set-csv">Impor tautan dari CSV / Spreadsheet</h3>
      <p className="field-hint">
        Baris pertama berisi nama kolom: <b>judul</b>, <b>url</b>, kategori, catatan, kata kunci, panduan, label (Indonesia atau Inggris).
        Tautan ditambahkan ke yang sudah ada; tidak ada yang diganti.
      </p>
      <Segmented name="csv-sumber" label="Sumber" value={sumber} onChange={(v) => {
        setSumber(v);
        setError("");
      }} options={[{ value: "tempel", label: "Tempel teks" }, { value: "berkas", label: "Berkas .csv" }, { value: "sheets", label: "Google Sheets" }]} />

      {sumber === "tempel" && (
        <form className="csv-src" onSubmit={(e) => {
          e.preventDefault();
          read(text);
        }}>
          <Field path="csv.teks" label="Teks CSV">
            <textarea {...wire("csv.teks", error || undefined)} rows={5} value={text} spellCheck={false}
              placeholder={"judul,url,kategori\nAbsensi,https://forms.gle/…,Absensi"} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="row-actions">
            <button type="submit" className="btn" disabled={!text.trim()}>Baca CSV</button>
          </div>
        </form>
      )}
      {sumber === "berkas" && (
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => file.current?.click()}>
            <FileCsv size={18} weight="bold" aria-hidden />
            Pilih berkas .csv
          </button>
          <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void readFile(f);
          }} />
        </div>
      )}
      {sumber === "sheets" && (
        <form className="csv-src" onSubmit={(e) => {
          e.preventDefault();
          void readSheet();
        }}>
          <Field path="csv.sheet" label="Link Google Sheets" hint="tab yang dibuka di link ikut terbaca">
            <input {...wire("csv.sheet", error || undefined, true)} type="url" inputMode="url" autoCapitalize="off" spellCheck={false}
              placeholder="https://docs.google.com/spreadsheets/d/…" value={sheet} onChange={(e) => setSheet(e.target.value.trim())} />
          </Field>
          <div className="row-actions">
            <button type="submit" className="btn" disabled={!sheet || busy === "sheet"}>{busy === "sheet" ? "Mengambil…" : "Ambil dari Sheets"}</button>
          </div>
          <p className="field-hint">Sheet harus bisa dibuka siapa saja yang punya link (Bagikan → Akses umum → Pelihat).</p>
        </form>
      )}
      <div aria-live="polite">{error && <p className="field-error" id={sumber === "tempel" ? "f-csv-teks-err" : "f-csv-sheet-err"}>{error}</p>}</div>

      {rows && (
        <div className="csv-preview">
          <p className="csv-sum" id="csv-preview" tabIndex={-1}>
            {rows.length} baris: <b>{count("baru")}</b> baru · <b>{count("duplikat")}</b> duplikat · <b>{count("error")}</b> error
          </p>
          {count("duplikat") > 0 && (
            <label className="switch">
              <input type="checkbox" role="switch" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} />
              <span>Lewati duplikat</span>
            </label>
          )}
          {unknown.length > 0 && (
            <Field path="csv.target" label="Kategori untuk yang belum cocok" hint={unknown.join(", ")}>
              <select {...wire("csv.target", undefined, true)} value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Pilih kategori</option>
                {site.kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </Field>
          )}
          <div className="csv-table" role="region" aria-label="Pratinjau impor" tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">Baris</th><th scope="col">Status</th><th scope="col">Tautan</th><th scope="col">Kategori</th><th scope="col">Keterangan</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} data-status={r.status} data-skip={!take.includes(r) || undefined}>
                    <td>{r.line}</td>
                    <td><span className="d-tag" data-tone={r.status === "baru" ? "yellow" : r.status === "error" ? undefined : "arsip"} data-error={r.status === "error" || undefined}>{STATUS_NAME[r.status]}</span></td>
                    <td><b>{r.link.judul || "—"}</b><span className="csv-url">{r.link.url || "—"}</span></td>
                    <td>{r.link.kategori ? katName(r.link.kategori) : <i>{target ? katName(target) : `${r.katRaw || "kosong"}?`}</i>}</td>
                    <td>
                      {r.status === "duplikat" ? `Sudah ada: ${r.note}` : r.note}
                      {r.changes.length > 0 && <span className="csv-url">Dirapikan: {r.changes.join(", ")}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {over && <p className="field-error">Melebihi {LINK_MAX} tautan ({site.link.length} sudah ada). Kurangi baris atau hapus tautan lama.</p>}
          <div className="row-actions">
            <button type="button" className="btn btn-primary" disabled={!take.length || (unknown.length > 0 && !target) || over || busy === "import"}
              onClick={() => void doImport()}>
              <UploadSimple size={18} weight="bold" aria-hidden />
              {busy === "import" ? "Mengimpor…" : `Impor ${take.length} tautan`}
            </button>
            <button type="button" className="btn" onClick={() => setRows(null)}>Batal</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- Version history ---------- */

const SHOWN = 10;

function Riwayat({ site, unsaved, onRestored }: { site: Site; unsaved: boolean; onRestored: (s: Site) => void }) {
  const [versions, setVersions] = useState<VersionInfo[] | null>(null);
  const [error, setError] = useState("");
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState<VersionInfo | null>(null);
  const [pending, setPending] = useState(false);
  const zona = site.status.zona;
  const at = new Intl.DateTimeFormat("id-ID", { timeZone: zona, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const load = useCallback(async () => {
    try {
      const r = await listHistory();
      if (r.ok) {
        setVersions(r.versions);
        setError("");
      } else if (EXPIRED.test(r.error)) sessionExpired(() => void load());
      else setError(r.error);
    } catch {
      setError("Server tidak terjangkau.");
    }
  }, []);

  // Each save adds a version and changes every diff, so reload once the save queue is idle.
  useEffect(() => {
    if (!unsaved) void load();
  }, [site, unsaved, load]);

  async function restore() {
    if (!pick) return;
    setPending(true);
    try {
      const r = await restoreVersion(pick.id);
      if (r.ok) {
        onRestored(r.site);
        setPick(null);
        toast.success("Versi dipulihkan. Isi sebelumnya tersimpan di riwayat.");
      } else if (EXPIRED.test(r.error)) sessionExpired(() => void restore());
      else toast.error(`Gagal memulihkan: ${r.error} Coba lagi.`);
    } catch {
      toast.error("Gagal memulihkan: server tidak terjangkau. Coba lagi.", [{ label: "Coba lagi", onClick: () => void restore() }]);
    } finally {
      setPending(false);
    }
  }

  const shown = all ? versions : versions?.slice(0, SHOWN);
  const now = Date.now();

  return (
    <section className="panel" aria-labelledby="set-hist">
      <div className="panel-head">
        <h3 className="panel-title" id="set-hist">Riwayat versi</h3>
        <button type="button" className="icon-btn" aria-label="Muat ulang riwayat" onClick={() => void load()}>
          <ArrowClockwise size={20} weight="bold" aria-hidden />
        </button>
      </div>
      <p className="field-hint">Isi halaman sebelum tiap perubahan, 50 terakhir. Memulihkan juga menyimpan isi sekarang ke riwayat.</p>
      <div aria-live="polite">
        {error ? (
          <p className="field-error">Gagal memuat riwayat: {error}</p>
        ) : !versions ? (
          <p className="field-hint">Memuat riwayat…</p>
        ) : versions.length === 0 ? (
          <p className="field-hint">Belum ada versi. Riwayat mulai terisi setelah perubahan berikutnya disimpan.</p>
        ) : (
          <ul className="hist">
            {shown!.map((v) => {
              const same = v.changes !== null && v.changes.length === 0;
              return (
                <li key={v.id}>
                  <div>
                    <span className="hist-when">{ago(v.savedAt, now)}</span>
                    <span className="hist-meta">
                      {at.format(new Date(v.savedAt))} {ZONA[zona]} · {v.links} tautan · {v.kategori} kategori{v.note && ` · ${v.note}`}
                    </span>
                    <span className="hist-diff">
                      {v.changes === null ? "Format lama, tidak bisa dipulihkan."
                        : same ? "Sama dengan isi sekarang."
                        : <>Jika dipulihkan: {v.changes.join(", ")}</>}
                    </span>
                  </div>
                  <button type="button" className="btn" disabled={v.changes === null || same || unsaved}
                    aria-label={`Pulihkan versi ${at.format(new Date(v.savedAt))}`} onClick={() => setPick(v)}>
                    <ClockCounterClockwise size={18} weight="bold" aria-hidden />
                    Pulihkan
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {versions && versions.length > SHOWN && (
        <button type="button" className="btn btn-quiet" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? `Tampilkan ${SHOWN} terbaru` : `Tampilkan semua (${versions.length})`}
        </button>
      )}

      <Confirm open={!!pick} title="Pulihkan versi ini?" confirmLabel="Pulihkan" pending={pending}
        onClose={() => setPick(null)} onConfirm={() => void restore()}>
        <p>
          Halaman kembali seperti {pick && at.format(new Date(pick.savedAt))} {ZONA[zona]}: {pick?.links} tautan, {pick?.kategori} kategori.
        </p>
        {pick?.changes && <p>Perubahan: {pick.changes.join(", ")}.</p>}
        <p className="field-hint">Isi sekarang disimpan ke riwayat, jadi bisa dipulihkan lagi.</p>
      </Confirm>
    </section>
  );
}

/* ---------- Password ---------- */

type PwField = "current" | "next" | "confirm";

function GantiPassword() {
  const [v, setV] = useState<Record<PwField, string>>({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState<{ field?: PwField; msg: string } | null>(null);
  const [pending, setPending] = useState(false);

  function fail(field: PwField | undefined, msg: string) {
    setErr({ field, msg });
    if (field) requestAnimationFrame(() => document.getElementById(`f-pw-${field}`)?.focus());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    // Same rules as the server, checked here first so the admin hears at once.
    if (!v.current) return fail("current", "Isi password sekarang.");
    if (v.next.length < 12) return fail("next", "Minimal 12 karakter.");
    if (v.next === v.current) return fail("next", "Harus beda dari password sekarang.");
    if (v.confirm !== v.next) return fail("confirm", "Tidak sama dengan password baru.");
    setPending(true);
    try {
      const r = await changePassword(v.current, v.next, v.confirm);
      if (r.ok) {
        setV({ current: "", next: "", confirm: "" });
        setErr(null);
        toast.success("Password diganti. Perangkat lain keluar otomatis.");
      } else if (EXPIRED.test(r.error)) sessionExpired();
      else fail(r.field, r.error);
    } catch {
      toast.error("Gagal mengganti password: server tidak terjangkau. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  const input = (field: PwField, label: string, auto: string, hint?: string) => {
    const e = err?.field === field ? err.msg : undefined;
    return (
      <Field path={`pw.${field}`} label={label} error={e} hint={hint}>
        <input {...wire(`pw.${field}`, e, !!hint)} type="password" autoComplete={auto} value={v[field]} maxLength={200}
          onChange={(ev) => {
            setV((o) => ({ ...o, [field]: ev.target.value }));
            if (err?.field === field) setErr(null);
          }} />
      </Field>
    );
  };

  return (
    <section className="panel" aria-labelledby="set-pw">
      <h3 className="panel-title" id="set-pw">Ganti password</h3>
      <form className="pw-form" onSubmit={(e) => void submit(e)} noValidate>
        {/* Lets password managers pair the new password with this account. */}
        <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
        {input("current", "Password sekarang", "current-password")}
        {input("next", "Password baru", "new-password", "minimal 12 karakter")}
        {input("confirm", "Ulangi password baru", "new-password")}
        {err && !err.field && <p className="field-error" role="alert">{err.msg}</p>}
        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            <Key size={18} weight="bold" aria-hidden />
            {pending ? "Mengganti…" : "Ganti password"}
          </button>
        </div>
        <p className="field-hint">Perangkat lain yang sedang masuk akan keluar. Perangkat ini tetap masuk.</p>
      </form>
    </section>
  );
}
