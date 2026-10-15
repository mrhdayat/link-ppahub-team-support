"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { z } from "zod";
import { ArrowSquareOut, Check, FloppyDisk, SignOut } from "@phosphor-icons/react";
import { RambuPage } from "@/components/rambu/rambu-page";
import { logout, save } from "@/app/actions";
import { siteSchema, type Site } from "@/lib/site";
import { Segmented, fid } from "./controls";
import { KategoriSection, LinksSection, ProfilSection, StatusSection, type LinkView, type Update } from "./sections";
import "@/components/rambu/tokens.css";
import "./editor.css";

// Indonesian copy for zod's generic messages; the schema's own messages still win.
z.config(z.locales.id());

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

const clock = (t: number) => new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export function Editor({ initial }: { initial: Site }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState("");
  const [view, setView] = useState<"atur" | "lihat">("atur");
  const [linkView, setLinkView] = useState<LinkView>({ q: "", kat: "" });
  const [open, setOpenSet] = useState<ReadonlySet<string>>(() => new Set());
  const [leaving, setLeaving] = useState(false);
  const [live, setLive] = useState("");
  const [pending, startSave] = useTransition();

  const check = useMemo(() => siteSchema.safeParse(draft), [draft]);
  // The preview shows the last draft that passes the schema, so a half-typed URL never breaks it.
  const [preview, setPreview] = useState(initial);
  if (check.success && check.data !== preview) setPreview(check.data);
  const stale = !check.success;

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  // Before the first save attempt fields stay quiet; afterwards errors track the draft live.
  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    if (attempted && !check.success) for (const i of check.error.issues) out[i.path.join(".")] ??= i.message;
    return out;
  }, [attempted, check]);
  const errorCount = Object.keys(errors).length;

  const update: Update = useCallback((fn) => {
    setDraft(fn);
    setFailure("");
  }, []);
  const setOpen = useCallback((id: string, on: boolean) => {
    setOpenSet((s) => {
      if (s.has(id) === on) return s;
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /** Bring a field into view: switch to "Atur", and for a link, clear the filter and unfold its row. */
  function showField(path: string) {
    const m = /^link\.(\d+)/.exec(path);
    const link = m ? draft.link[Number(m[1])] : undefined;
    flushSync(() => {
      setView("atur");
      if (link) {
        setLinkView({ q: "", kat: "" });
        setOpen(link.id, true);
      }
    });
    focusPath(path);
  }

  function onSave() {
    flushSync(() => {
      setAttempted(true);
      setFailure("");
    });
    if (!check.success) {
      showField(check.error.issues[0]!.path.join("."));
      return;
    }
    const snapshot = draft;
    startSave(async () => {
      try {
        const r = await save(check.data);
        if (r.ok) {
          setSaved(snapshot);
          setSavedAt(r.savedAt);
          setAttempted(false);
          setToast(true);
        } else {
          setFailure(r.error);
          if (r.path) showField(r.path);
        }
      } catch {
        setFailure("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  const state = pending ? "busy" : failure || errorCount ? "error" : dirty ? "dirty" : "saved";
  const status = pending
    ? "Menyimpan…"
    : failure || (errorCount
      ? `${errorCount} isian perlu diperbaiki`
      : dirty
        ? "Belum disimpan"
        : savedAt
          ? `Tersimpan pukul ${clock(savedAt)}`
          : "Tidak ada perubahan");

  const props = { site: draft, update, errors, announce: setLive };

  return (
    <div className="ed" data-view={view}>
      <header className="ed-top">
        <div className="hazard" aria-hidden />
        <div className="ed-top-row">
          <h1>Editor rambu</h1>
          <Segmented name="view" label="Tampilkan" hideLabel className="view-switch" value={view} onChange={setView}
            options={[{ value: "atur", label: "Atur" }, { value: "lihat", label: "Lihat" }]} />
        </div>
      </header>

      <main className="ed-controls">
        <ProfilSection {...props} />
        <StatusSection {...props} />
        <KategoriSection {...props} />
        <LinksSection {...props} view={linkView} setView={setLinkView} open={open} setOpen={setOpen} />
      </main>

      <aside className="ed-preview" aria-label="Pratinjau halaman">
        {stale && <p className="preview-note">Pratinjau menunggu isian yang valid.</p>}
        {/* Inert: the preview is a picture of the page, so its links don't navigate away from unsaved work. */}
        <div inert>
          <RambuPage site={preview} preview />
        </div>
      </aside>

      <div className="ed-bar">
        {toast && (
          <p className="toast" aria-hidden>
            <Check size={18} weight="bold" aria-hidden />
            Tersimpan
          </p>
        )}
        <p className="bar-status" data-state={state} role={failure ? "alert" : "status"}>{status}</p>
        <div className="bar-actions">
          <a className="btn" href="/" target="_blank" rel="noopener">
            <ArrowSquareOut size={18} weight="bold" aria-hidden />
            <span className="btn-text">Lihat halaman</span>
          </a>
          <form action={logout}>
            <button type="submit" className="btn" data-danger={leaving || undefined} onBlur={() => setLeaving(false)}
              onClick={(e) => {
                // Leaving with unsaved work takes a second press, not a dialog.
                if (dirty && !leaving) {
                  e.preventDefault();
                  setLeaving(true);
                }
              }}>
              <SignOut size={18} weight="bold" aria-hidden />
              <span className="btn-text">{leaving ? "Buang & keluar" : "Keluar"}</span>
            </button>
          </form>
          <button type="button" className="btn btn-primary" data-dirty={dirty || undefined} disabled={!dirty || pending}
            onClick={onSave}>
            <FloppyDisk size={18} weight="bold" aria-hidden />
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{live}</p>
    </div>
  );
}
