"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowSquareOut, ChartBar, Eye, EyeSlash, GearSix, IdentificationCard, LinkSimple, SignOut, Tag,
} from "@phosphor-icons/react";
import { RambuPage } from "@/components/rambu/rambu-page";
import { logout, save, type SaveResult } from "@/app/actions";
import { getStats } from "@/app/admin/actions";
import type { Day } from "@/lib/analytics";
import { siteSchema, type Site } from "@/lib/site";
import { EXPIRED, Toaster, sessionExpired, toast } from "./toast";
import { Confirm } from "./modal";
import { Ringkasan } from "./ringkasan";
import { Tautan, type LinkEdit } from "./tautan";
import { KategoriTab } from "./kategori";
import { ProfilTab, PROFIL_KEYS, type ProfilFields } from "./profil";
import { Pengaturan } from "./pengaturan";
import { isTab, type Tab } from "./tabs";
import "@/components/rambu/tokens.css";
import "./dashboard.css";

// Indonesian copy for zod's generic messages; the schema's own messages still win.
z.config(z.locales.id());

export type CommitResult = { ok: true } | { ok: false; error: string; path?: string };
/**
 * Apply a change to the whole CONFIG, show it at once, and persist it through the `save` action.
 * `done` is the success toast. `form` = the caller keeps its own form open and shows the error inline,
 * so the failure toast carries no Retry (the form's own submit is the retry).
 */
export type Commit = (fn: (s: Site) => Site, opts?: { done?: string; form?: boolean }) => Promise<CommitResult>;

type Job = { fn: (s: Site) => Site; snapshot: Site; done?: string; form?: boolean; resolve: (r: CommitResult) => void };

const NAV: { tab: Tab; label: string; short: string; Icon: typeof ChartBar }[] = [
  { tab: "ringkasan", label: "Ringkasan", short: "Ringkasan", Icon: ChartBar },
  { tab: "tautan", label: "Tautan", short: "Tautan", Icon: LinkSimple },
  { tab: "kategori", label: "Kategori", short: "Kategori", Icon: Tag },
  { tab: "profil", label: "Profil & status", short: "Profil", Icon: IdentificationCard },
  { tab: "pengaturan", label: "Pengaturan", short: "Atur", Icon: GearSix },
];
const WITH_PREVIEW: Tab[] = ["tautan", "kategori", "profil"];

const reason = (e: string) => e.replace(/[.\s]+$/, "");

export function Dashboard({ initial, days: initialDays, today, initialTab }: {
  initial: Site; days: Day[]; today: string; initialTab: Tab;
}) {
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [site, setSiteState] = useState(initial);
  const siteRef = useRef(initial);
  const confirmed = useRef(initial);
  const queue = useRef<Job[]>([]);
  const running = useRef(false);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(initialDays);
  const [loadingStats, setLoadingStats] = useState(false);
  const [linkEdit, setLinkEdit] = useState<LinkEdit>(null);
  const [profilEdits, setProfilEdits] = useState<ProfilFields | null>(null);
  const [showPreview, setShowPreview] = useState(true); // desktop column
  const [phoneView, setPhoneView] = useState<"atur" | "lihat">("atur");
  const [leaving, setLeaving] = useState(false);
  const logoutForm = useRef<HTMLFormElement>(null);

  const setSite = (s: Site) => {
    siteRef.current = s;
    setSiteState(s);
  };

  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSaving(true);
    while (queue.current.length) {
      const job = queue.current[0]!;
      let r: SaveResult;
      try {
        r = await save(job.snapshot);
      } catch {
        r = { ok: false, error: "server tidak terjangkau. Periksa koneksi" };
      }
      if (r.ok) {
        confirmed.current = job.snapshot;
        queue.current.shift();
        if (job.done) toast.success(job.done);
        job.resolve({ ok: true });
        continue;
      }
      // Every change after the last confirmed save was built on this one: roll them all back together,
      // then offer to replay them in order. Nothing is dropped without the admin hearing about it.
      const failed = queue.current.splice(0);
      siteRef.current = confirmed.current;
      setSiteState(confirmed.current);
      const err = r.error;
      for (const j of failed) j.resolve({ ok: false, error: err, path: r.ok ? undefined : r.path });
      const replay = failed.filter((j) => !j.form);
      const retry = replay.length
        ? () => replay.forEach((j) => void commitRef.current(j.fn, { done: j.done }))
        : undefined;
      if (EXPIRED.test(err)) sessionExpired(retry);
      else toast.error(`Gagal menyimpan: ${reason(err)}. Coba lagi.`, retry ? [{ label: "Coba lagi", onClick: retry }] : []);
    }
    running.current = false;
    setSaving(false);
  }, []);

  const commit: Commit = useCallback(
    (fn, opts = {}) =>
      new Promise<CommitResult>((resolve) => {
        const parsed = siteSchema.safeParse(fn(siteRef.current));
        if (!parsed.success) {
          const issue = parsed.error.issues[0]!;
          if (!opts.form) toast.error(`Gagal menyimpan: ${reason(issue.message)}. Coba lagi.`);
          resolve({ ok: false, error: issue.message, path: issue.path.join(".") });
          return;
        }
        siteRef.current = parsed.data;
        setSiteState(parsed.data);
        queue.current.push({ fn, snapshot: parsed.data, ...opts, resolve });
        void drain();
      }),
    [drain],
  );
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const refreshStats = useCallback(async (quiet = false) => {
    setLoadingStats(true);
    try {
      const r = await getStats();
      if (r.ok) {
        setDays(r.days);
        if (!quiet) toast.success("Statistik diperbarui");
      } else if (EXPIRED.test(r.error)) sessionExpired(() => refreshStats());
      else toast.error(`Gagal memuat statistik: ${reason(r.error)}. Coba lagi.`);
    } catch {
      toast.error("Gagal memuat statistik: server tidak terjangkau. Coba lagi.", [
        { label: "Coba lagi", onClick: () => void refreshStats() },
      ]);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* ---------- Tabs: ?tab= deep link, #tab also accepted, back/forward work ---------- */

  const setTab = useCallback((t: Tab, focus = false) => {
    setTabState(t);
    setPhoneView("atur");
    if (new URLSearchParams(location.search).get("tab") !== t) history.pushState(null, "", `?tab=${t}`);
    if (focus) requestAnimationFrame(() => document.getElementById(`sec-${t}`)?.focus({ preventScroll: false }));
  }, []);

  useEffect(() => {
    const fromHash = location.hash.slice(1);
    if (isTab(fromHash)) {
      setTabState(fromHash);
      history.replaceState(null, "", `?tab=${fromHash}`);
    }
    const onPop = () => {
      const t = new URLSearchParams(location.search).get("tab") ?? "ringkasan";
      if (isTab(t)) setTabState(t);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* ---------- Unsaved work ---------- */

  const profilDirty = useMemo(
    () => !!profilEdits && PROFIL_KEYS.some((k) => JSON.stringify(profilEdits[k]) !== JSON.stringify(site[k])),
    [profilEdits, site],
  );
  const unsaved = profilDirty || saving;
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  /* ---------- "n" = new link, only when not typing and nothing modal is open ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      setTab("tautan");
      setLinkEdit({ mode: "add" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setTab]);

  /* ---------- Preview ---------- */

  const merged = profilDirty && profilEdits ? { ...site, ...profilEdits } : site;
  const check = useMemo(() => siteSchema.safeParse(merged), [merged]);
  const [preview, setPreview] = useState(site);
  if (check.success && check.data !== preview && JSON.stringify(check.data) !== JSON.stringify(preview)) setPreview(check.data);
  const hasPreview = WITH_PREVIEW.includes(tab);

  const editLink = useCallback((id: string) => {
    setTab("tautan");
    setLinkEdit({ mode: "edit", id });
  }, [setTab]);

  return (
    <div className="dash" data-tab={tab} data-preview={hasPreview && showPreview ? "" : undefined}
      data-phone-view={hasPreview ? phoneView : "atur"}>
      <header className="dash-top">
        <div className="hazard" aria-hidden />
        <div className="dash-top-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- 32px static logo, already sized */}
          <p className="dash-brand"><img className="dash-logo" src="/logo-ppa.png" alt="" width={32} height={32} /><span dir="auto">{site.profil.nama}</span> <small>Admin</small></p>
          <span className="save-state" data-saving={saving || undefined} aria-hidden>
            {saving ? "Menyimpan…" : "Tersimpan"}
          </span>
          {hasPreview && (
            <button type="button" className="btn btn-dark phone-only" aria-pressed={phoneView === "lihat"}
              onClick={() => setPhoneView((v) => (v === "lihat" ? "atur" : "lihat"))}>
              {phoneView === "lihat" ? <EyeSlash size={18} weight="bold" aria-hidden /> : <Eye size={18} weight="bold" aria-hidden />}
              {phoneView === "lihat" ? "Tutup" : "Lihat"}
            </button>
          )}
        </div>
      </header>

      <nav className="dash-nav" aria-label="Bagian panel">
        <ul>
          {NAV.map(({ tab: t, label, short, Icon }) => (
            <li key={t}>
              <a href={`?tab=${t}`} aria-current={tab === t ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  setTab(t, true);
                }}>
                <Icon size={22} weight={tab === t ? "fill" : "bold"} aria-hidden />
                <span className="nav-long">{label}</span>
                <span className="nav-short" aria-hidden>{short}</span>
                {t === "profil" && profilDirty && <span className="dirty-dot" role="img" aria-label="ada perubahan belum disimpan" />}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-foot">
          <a className="btn" href="/" target="_blank" rel="noopener">
            <ArrowSquareOut size={18} weight="bold" aria-hidden />
            Lihat halaman
          </a>
          <form action={logout} ref={logoutForm}>
            <button type="submit" className="btn" onClick={(e) => {
              if (unsaved) {
                e.preventDefault();
                setLeaving(true);
              }
            }}>
              <SignOut size={18} weight="bold" aria-hidden />
              Keluar
            </button>
          </form>
        </div>
      </nav>

      <main className="dash-main">
        {tab === "ringkasan" && (
          <Ringkasan site={site} days={days} today={today} loading={loadingStats}
            onRefresh={() => void refreshStats()} onEditLink={editLink} />
        )}
        {tab === "tautan" && <Tautan site={site} days={days} commit={commit} edit={linkEdit} setEdit={setLinkEdit} />}
        {tab === "kategori" && <KategoriTab site={site} days={days} commit={commit} />}
        {tab === "profil" && (
          <ProfilTab site={site} edits={profilEdits} setEdits={setProfilEdits} dirty={profilDirty} commit={commit} />
        )}
        {tab === "pengaturan" && (
          <Pengaturan site={site} commit={commit} unsaved={unsaved} onLogout={() => setLeaving(true)}
            onStatsReset={() => setDays([])} />
        )}
      </main>

      {hasPreview && (
        <aside className="dash-preview" aria-label="Pratinjau halaman">
          <div className="preview-bar">
            <span>Pratinjau</span>
            {!check.success && <span className="preview-note">Menunggu isian yang valid</span>}
            <button type="button" className="btn btn-quiet desk-only" aria-expanded={showPreview}
              onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? <EyeSlash size={18} weight="bold" aria-hidden /> : <Eye size={18} weight="bold" aria-hidden />}
              {showPreview ? "Sembunyikan" : "Tampilkan pratinjau"}
            </button>
          </div>
          {/* Inert: a picture of the page, so its links never navigate away from the panel. */}
          {showPreview || phoneView === "lihat" ? (
            <div className="preview-frame" inert>
              <RambuPage site={preview} preview />
            </div>
          ) : null}
        </aside>
      )}

      <Confirm open={leaving} title="Keluar dari panel?" confirmLabel="Buang & keluar" danger
        onClose={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          setProfilEdits(null);
          // Let the beforeunload guard unmount before the form navigates.
          requestAnimationFrame(() => logoutForm.current?.requestSubmit());
        }}>
        <p>{saving ? "Perubahan terakhir masih disimpan." : "Perubahan di Profil & status belum disimpan."} Kalau keluar sekarang, perubahan itu hilang.</p>
      </Confirm>

      <Toaster />
    </div>
  );
}

