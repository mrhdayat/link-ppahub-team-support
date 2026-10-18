"use client";

import { useRef, useState } from "react";
import { ArrowCounterClockwise, CopySimple, DownloadSimple, QrCode, SignOut, UploadSimple } from "@phosphor-icons/react";
import { logout } from "@/app/actions";
import { resetStats } from "@/app/admin/actions";
import { siteSchema, type Site } from "@/lib/site";
import { copyText, download, publicUrl } from "./controls";
import { Confirm } from "./modal";
import { EXPIRED, sessionExpired, toast } from "./toast";
import type { Commit } from "./dashboard";

/** "link.3.url" → "tautan ke-4, kolom url": where in the file the problem is, in words. */
function where(path: PropertyKey[]): string {
  const [a, b, c] = path;
  const name: Record<string, string> = { link: "tautan", kategori: "kategori", teksBerjalan: "teks berjalan" };
  if (typeof b === "number" && typeof a === "string") return `${name[a] ?? a} ke-${b + 1}${c !== undefined ? `, kolom ${String(c)}` : ""}`;
  return path.map(String).join(".") || "berkas";
}

export function Pengaturan({ site, commit, unsaved, onLogout, onStatsReset }: {
  site: Site; commit: Commit; unsaved: boolean; onLogout: () => void; onStatsReset: () => void;
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
