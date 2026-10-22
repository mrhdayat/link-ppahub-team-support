"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowClockwise, ArrowCounterClockwise, ClockCounterClockwise, CopySimple, DownloadSimple, Key, QrCode, SignOut, UploadSimple,
} from "@phosphor-icons/react";
import { changePassword, logout } from "@/app/actions";
import { listHistory, resetStats, restoreVersion, type VersionInfo } from "@/app/admin/actions";
import { ZONA, siteSchema, type Site } from "@/lib/site";
import { Field, copyText, download, publicUrl, wire } from "./controls";
import { Confirm } from "./modal";
import { EXPIRED, sessionExpired, toast } from "./toast";
import { ago } from "./stats";
import type { Commit } from "./dashboard";
import "./insight.css";

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
