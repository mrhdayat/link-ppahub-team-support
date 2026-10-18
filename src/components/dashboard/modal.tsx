"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/**
 * Native modal <dialog>: the browser makes the page behind it inert (focus stays inside) and Esc fires
 * `cancel`, which we route to onClose so the parent decides (e.g. ask before dropping unsaved edits).
 * Focus goes back to whatever opened it.
 */
export function Modal({
  open, onClose, title, variant = "dialog", children, footer,
}: {
  open: boolean; onClose: () => void; title: ReactNode; variant?: "dialog" | "drawer";
  children: ReactNode; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      // React's autoFocus fires before showModal, which then moves focus to the first button; pick ours after.
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Unmounted while open (e.g. a keyed form swapped out on close): no `close` event fires, so return focus here.
  useEffect(() => {
    const d = ref.current!;
    return () => {
      const el = opener.current;
      if (d.open) requestAnimationFrame(() => el?.isConnected && el.focus());
    };
  }, []);

  return (
    <dialog ref={ref} className="modal" data-variant={variant} aria-labelledby={`${id}-t`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        const el = opener.current;
        if (el?.isConnected) el.focus();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself, outside its inner box.
        if (e.target === e.currentTarget) onClose();
      }}>
      {open && (
        <div className="modal-box">
          <header className="modal-head">
            <h2 id={`${id}-t`}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="Tutup" onClick={onClose}>
              <X size={20} weight="bold" aria-hidden />
            </button>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

/** Yes/no question. `typed` makes the admin type a word before the destructive button unlocks. */
export function Confirm({
  open, title, children, confirmLabel, danger, typed, pending, onConfirm, onClose,
}: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; danger?: boolean;
  typed?: string; pending?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  const [text, setText] = useState("");
  const id = useId();
  const locked = !!typed && text.trim() !== typed;
  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} data-autofocus={typed ? undefined : ""}>Batal</button>
          <button type="submit" form={`${id}-f`} className="btn" data-danger={danger || undefined}
            disabled={locked || pending}>
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </>
      }>
      <form id={`${id}-f`} className="confirm-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked && !pending) onConfirm();
        }}>
        {children}
        {typed && (
          <div className="field">
            <label htmlFor={`${id}-typed`}>Ketik <b>{typed}</b> untuk melanjutkan</label>
            <input id={`${id}-typed`} value={text} autoComplete="off" autoCapitalize="characters" spellCheck={false}
              data-autofocus="" onChange={(e) => setText(e.target.value)} />
          </div>
        )}
      </form>
    </Modal>
  );
}
