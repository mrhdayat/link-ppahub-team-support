"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from "react";
import { ArrowCounterClockwise, Check, Info, Warning, X } from "@phosphor-icons/react";

// One notification system for the admin: call toast.success(...) from anywhere, render <Toaster /> once.
// success/info leave after 4s, undo after 6s, errors stay until dismissed. Timers pause on hover, focus,
// and while the tab is hidden.

export type ToastAction = { label: string; onClick?: () => void; href?: string };
type Kind = "success" | "error" | "info" | "undo";
type Item = { id: number; kind: Kind; title: string; actions: ToastAction[]; leaving?: boolean };

const LIFETIME: Record<Kind, number> = { success: 4000, info: 4000, undo: 6000, error: 0 };
const EXIT_MS = 200;
const MAX = 3;

let items: Item[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
const EMPTY: Item[] = [];

export function dismiss(id: number) {
  if (!items.some((t) => t.id === id && !t.leaving)) return;
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, EXIT_MS);
}

function push(kind: Kind, title: string, actions: ToastAction[] = []): number {
  // The same message twice replaces the first instead of stacking (no toast spam from repeated clicks).
  for (const t of items) if (!t.leaving && t.kind === kind && t.title === title) dismiss(t.id);
  const id = ++seq;
  items = [...items, { id, kind, title, actions }];
  emit();
  const live = items.filter((t) => !t.leaving);
  for (const t of live.slice(0, Math.max(0, live.length - MAX))) dismiss(t.id);
  return id;
}

export const toast = {
  success: (title: string, actions?: ToastAction[]) => push("success", title, actions),
  info: (title: string, actions?: ToastAction[]) => push("info", title, actions),
  error: (title: string, actions?: ToastAction[]) => push("error", title, actions),
  undo: (title: string, onUndo: () => void) => push("undo", title, [{ label: "Urungkan", onClick: onUndo }]),
};

/** Matches the session-expired message every admin action returns. */
export const EXPIRED = /^Sesi habis/;

/** Session expired: say so once, with a way back in (new tab) that keeps this tab and its unsaved work open. */
export function sessionExpired(retry?: () => void) {
  const actions: ToastAction[] = [{ label: "Masuk", href: "/admin/login" }];
  if (retry) actions.push({ label: "Coba lagi", onClick: retry });
  toast.error("Sesi habis. Masuk lagi.", actions);
}

const ICON = { success: Check, error: Warning, info: Info, undo: ArrowCounterClockwise } as const;

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const leave = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
  };

  return (
    <section className="toaster" aria-label="Notifikasi" onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={leave}>
      <ol aria-live="polite" aria-relevant="additions">
        {list.map((t) => <ToastItem key={t.id} t={t} paused={hover || focus || hidden} />)}
      </ol>
    </section>
  );
}

function ToastItem({ t, paused }: { t: Item; paused: boolean }) {
  const ms = LIFETIME[t.kind];
  const left = useRef(ms);
  useEffect(() => {
    if (!ms || paused || t.leaving) return;
    const start = Date.now();
    const timer = setTimeout(() => dismiss(t.id), left.current);
    return () => {
      clearTimeout(timer);
      left.current -= Date.now() - start;
    };
  }, [ms, paused, t.id, t.leaving]);

  const Icon = ICON[t.kind];
  return (
    <li className="d-toast" data-kind={t.kind} data-leaving={t.leaving || undefined}
      role={t.kind === "error" ? "alert" : "status"}>
      <span className="toast-icon" aria-hidden><Icon size={20} weight="bold" /></span>
      <p className="toast-title">{t.title}</p>
      {t.actions.length > 0 && (
        <span className="toast-actions">
          {t.actions.map((a) =>
            a.href ? (
              <a key={a.label} className="toast-action" href={a.href} target="_blank" rel="noopener">{a.label}</a>
            ) : (
              <button key={a.label} type="button" className="toast-action"
                onClick={() => {
                  a.onClick?.();
                  dismiss(t.id);
                }}>
                {a.label}
              </button>
            ),
          )}
        </span>
      )}
      <button type="button" className="toast-close" aria-label="Tutup notifikasi" onClick={() => dismiss(t.id)}>
        <X size={18} weight="bold" aria-hidden />
      </button>
    </li>
  );
}
