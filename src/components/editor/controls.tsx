"use client";

import type { CSSProperties, ReactNode } from "react";

// Hardware-styled controls. Every one keeps a native input underneath for keyboard and screen readers.

/** "links.2.url" → "f-links-2-url": the DOM id a validation path points at. */
export const fid = (path: string) => `f-${path.replace(/\./g, "-")}`;

export function Field({
  path, label, error, hint, children,
}: { path: string; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field" data-invalid={error ? "" : undefined}>
      <div className="field-head">
        <label htmlFor={fid(path)}>{label}</label>
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      {children}
      {error && <p className="field-error" id={`${fid(path)}-err`}>{error}</p>}
    </div>
  );
}

/** Props that wire an input to its Field: id, error description, invalid flag. */
export const wire = (path: string, error?: string) => ({
  id: fid(path),
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${fid(path)}-err` : undefined,
});

/** Truck toggle on a native checkbox: the lever flips up for on, and an LED mirrors it so state never relies on position alone. */
export function Switch({
  id, label, checked, onChange,
}: { id?: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle" aria-hidden><span className="lever" /></span>
      <span className="led" aria-hidden />
      <span>{label}</span>
    </label>
  );
}

/** Mixer fader: a native range with a ridged cap over a ticked groove, and a VFD readout. */
export function Fader({
  id, label, value, min, max, step = 1, format, onChange,
}: {
  id: string; label: string; value: number; min: number; max: number; step?: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="fader">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="readout">{format(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Segmented keys on native radios: arrow keys move between options for free. */
export function Segmented<T extends string>({
  name, label, value, options, onChange, hideLabel,
}: {
  name: string; label: string; value: T; hideLabel?: boolean;
  options: { value: T; label: ReactNode; style?: CSSProperties }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend className={hideLabel ? "sr-only" : undefined}>{label}</legend>
      <div className="segmented-row">
        {options.map((o) => (
          <label key={o.value} style={o.style}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="led" aria-hidden />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A paint sample card ("chip") or a VFD glow dot ("dot"); a native radio carries the choice. */
export function Swatch({
  name, label, color, checked, onSelect, kind = "chip",
}: { name: string; label: string; color: string; checked: boolean; onSelect: () => void; kind?: "chip" | "dot" }) {
  return (
    <label className="swatch" data-kind={kind} style={{ "--c": color } as CSSProperties}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      <span className="swatch-face" aria-hidden>
        <span className="swatch-color" />
        <span className="led" />
      </span>
      <span className="swatch-label">{label}</span>
    </label>
  );
}
