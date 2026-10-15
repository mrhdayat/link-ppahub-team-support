"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { z } from "zod";
import { ArrowCounterClockwise, ArrowSquareOut, SignOut } from "@phosphor-icons/react";
import { Faceplate } from "@/components/faceplate";
import { logout, save } from "@/app/actions";
import { siteSchema, type Site } from "@/lib/site";
import { Segmented, fid } from "./controls";
import { PANEL } from "./panel";
import { LinksSection, LookSection, ProfileSection, SocialsSection, type Update } from "./sections";
import "./editor.css";

// Indonesian copy for zod's generic messages; the schema's own messages still win.
z.config(z.locales.id());

function issuesOf(site: Site): Record<string, string> {
  const r = siteSchema.safeParse(site);
  const out: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

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
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState("");
  const [undo, setUndo] = useState<{ message: string; restore: (s: Site) => Site } | null>(null);
  const [view, setView] = useState<"atur" | "lihat">("atur");
  const [live, setLive] = useState("");
  const [pending, startSave] = useTransition();
  const toast = useRef<HTMLDivElement>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  // Before the first save attempt fields stay quiet; afterwards errors track the draft live.
  const errors = useMemo(() => (attempted ? issuesOf(draft) : {}), [attempted, draft]);
  const errorCount = Object.keys(errors).length;

  const update: Update = useCallback((fn) => {
    setDraft(fn);
    setFailure("");
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // The undo offer fades after 8 s, but never while the pointer or focus is on it.
  useEffect(() => {
    if (!undo) return;
    const t = setInterval(() => {
      if (!toast.current?.matches(":hover, :focus-within")) setUndo(null);
    }, 8000);
    return () => clearInterval(t);
  }, [undo]);

  function showField(path: string) {
    flushSync(() => setView("atur"));
    focusPath(path);
  }

  function onSave() {
    setAttempted(true);
    setFailure("");
    const parsed = siteSchema.safeParse(draft);
    if (!parsed.success) {
      showField(parsed.error.issues[0]!.path.join("."));
      return;
    }
    const snapshot = draft;
    startSave(async () => {
      try {
        const r = await save(parsed.data);
        if (r.ok) {
          setSaved(snapshot);
          setSavedAt(r.savedAt);
          setAttempted(false);
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
    : failure
      ? failure
      : errorCount
        ? `${errorCount} isian perlu diperbaiki`
        : dirty
          ? "Belum disimpan"
          : savedAt
            ? `Tersimpan pukul ${clock(savedAt)}`
            : "Tidak ada perubahan";

  const props = {
    site: draft,
    update,
    errors,
    announce: setLive,
    onRemoved: (message: string, restore: (s: Site) => Site) => setUndo({ message, restore }),
  };

  return (
    <div className="ed" style={PANEL} data-view={view}>
      <header className="ed-top">
        <h1>Editor halaman</h1>
        <Segmented name="view" label="Tampilkan" hideLabel value={view} onChange={setView}
          options={[{ value: "atur", label: "Atur" }, { value: "lihat", label: "Lihat" }]} />
      </header>

      <main className="ed-controls">
        <ProfileSection {...props} />
        <LinksSection {...props} />
        <SocialsSection {...props} />
        <LookSection {...props} />
      </main>

      <aside className="ed-preview" aria-label="Pratinjau halaman">
        {/* Inert: the preview is a picture of the page, so its links don't navigate away from unsaved work. */}
        <div inert>
          <Faceplate site={draft} boot={false} />
        </div>
      </aside>

      <div className="ed-bar">
        {undo && (
          <div className="toast" ref={toast} role="status">
            <span>{undo.message}</span>
            <button type="button" className="btn" onClick={() => { update(undo.restore); setUndo(null); setLive("Dikembalikan."); }}>
              <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
              Urungkan
            </button>
          </div>
        )}
        <div className="bar-row">
          <p className="status" data-state={state} role={failure ? "alert" : "status"}>
            <span className="led" aria-hidden />
            {status}
          </p>
          <div className="bar-actions">
            <a className="btn" href="/" target="_blank" rel="noopener">
              <ArrowSquareOut size={18} weight="bold" aria-hidden />
              Lihat halaman
            </a>
            <form action={logout}>
              <button type="submit" className="btn">
                <SignOut size={18} weight="bold" aria-hidden />
                Keluar
              </button>
            </form>
            <button type="button" className="btn primary" disabled={!dirty || pending} onClick={onSave}>
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{live}</p>
    </div>
  );
}
