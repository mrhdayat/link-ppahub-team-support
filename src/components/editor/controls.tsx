"use client";

import type { ComponentProps, ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash } from "@phosphor-icons/react";
import type { Warna } from "@/lib/site";

/** "link.2.url" → "f-link-2-url": the DOM id a validation path points at. */
export const fid = (path: string) => `f-${path.replace(/\./g, "-")}`;

export const WARNA_NAME: Record<Warna, string> = { green: "Hijau", blue: "Biru", red: "Merah", yellow: "Kuning", white: "Putih" };

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Focus the first of these ids that exists and is enabled, after React has painted. */
export const focusLater = (...ids: string[]) =>
  requestAnimationFrame(() => {
    for (const id of ids) {
      const el = document.getElementById(id) as HTMLButtonElement | null;
      if (el && !el.disabled) return el.focus();
    }
  });

export function swap<T>(arr: T[], i: number, j: number): T[] {
  const a = [...arr];
  [a[i], a[j]] = [a[j]!, a[i]!];
  return a;
}
export function insertAt<T>(arr: T[], i: number, item: T): T[] {
  return [...arr.slice(0, i), item, ...arr.slice(i)];
}

/** "Toko Online!" → "toko-online": the category id the schema accepts. */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/, "");
}

/** `base`, or `base-2`, `base-3`… whichever isn't taken. */
export function uniqueSlug(base: string, taken: string[]): string {
  const b = base || "jalur";
  if (!taken.includes(b)) return b;
  for (let n = 2; ; n++) {
    const s = `${b.slice(0, 24 - String(n).length - 1)}-${n}`;
    if (!taken.includes(s)) return s;
  }
}

/** Two-letter sign initials: first letters of the first two words, or the first two letters of one word. */
export function initialsOf(nama: string): string {
  const words = nama.trim().split(/\s+/).filter(Boolean);
  const chars = words.length > 1 ? words.slice(0, 2).map((w) => Array.from(w)[0]) : Array.from(words[0] ?? "").slice(0, 2);
  return chars.join("").toUpperCase();
}

export function Field({
  path, label, error, hint, children,
}: { path: string; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field" data-invalid={error ? "" : undefined}>
      <div className="field-head">
        <label htmlFor={fid(path)}>{label}</label>
        {hint && <span className="field-hint" id={`${fid(path)}-hint`}>{hint}</span>}
      </div>
      {children}
      {error && <p className="field-error" id={`${fid(path)}-err`}>{error}</p>}
    </div>
  );
}

/** Props that wire an input to its Field: id, error description, invalid flag. */
export const wire = (path: string, error?: string, hint?: boolean) => {
  const by = [error && `${fid(path)}-err`, hint && `${fid(path)}-hint`].filter(Boolean).join(" ");
  return { id: fid(path), "aria-invalid": error ? true : undefined, "aria-describedby": by || undefined };
};

/** Segmented plates on native radios: arrow keys move between options for free. */
export function Segmented<T extends string>({
  name, label, value, options, onChange, hideLabel, id, disabled, className,
}: {
  name: string; label: string; value: T; hideLabel?: boolean; id?: string; disabled?: boolean; className?: string;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className={`segmented ${className ?? ""}`} disabled={disabled}>
      <legend className={hideLabel ? "sr-only" : undefined}>{label}</legend>
      <div className="segmented-row">
        {options.map((o, i) => (
          <label key={o.value}>
            <input type="radio" name={name} value={o.value} id={i === 0 ? id : undefined}
              checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Up / down / delete for one row. Ids let focus follow the row after it moves. */
export function RowTools({ prefix, name, first, last, onMove, onRemove }: {
  prefix: string; name: string; first: boolean; last: boolean;
  onMove: (d: -1 | 1) => void; onRemove: () => void;
}) {
  return (
    <div className="row-tools">
      <button type="button" className="icon-btn" id={`${prefix}-up`} disabled={first}
        aria-label={`Naikkan ${name}`} onClick={() => onMove(-1)}>
        <ArrowUp size={18} weight="bold" aria-hidden />
      </button>
      <button type="button" className="icon-btn" id={`${prefix}-down`} disabled={last}
        aria-label={`Turunkan ${name}`} onClick={() => onMove(1)}>
        <ArrowDown size={18} weight="bold" aria-hidden />
      </button>
      <button type="button" className="icon-btn" data-danger id={`${prefix}-del`}
        aria-label={`Hapus ${name}`} onClick={onRemove}>
        <Trash size={18} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

/** Small sign plate in a category colour. */
export const Plate = ({ warna, children }: { warna: Warna | undefined; children?: ReactNode }) => (
  <span className="plate" data-warna={warna ?? "none"}>{children}</span>
);

/** Whole-number box. A cleared box is NaN in the draft, which the schema refuses, so the admin can clear and retype. */
export function NumberInput({ value, onValue, ...rest }: Omit<ComponentProps<"input">, "value" | "type"> & {
  value: number; onValue: (n: number) => void;
}) {
  return (
    <input {...rest} type="number" inputMode="numeric" step={1} value={Number.isNaN(value) ? "" : value}
      onChange={(e) => onValue(e.target.valueAsNumber)} />
  );
}
