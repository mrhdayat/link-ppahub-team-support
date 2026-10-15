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

/** Slide switch on a native checkbox. Its LED mirrors the state so on/off never relies on position alone. */
export function Switch({
  id, label, checked, onChange,
}: { id?: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden>
        <span className="switch-cap"><span className="led" /></span>
      </span>
      <span>{label}</span>
    </label>
  );
}

/** Fader: a native range with a ridged cap and an LCD-style readout. */
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
  options: { value: T; label: string; style?: CSSProperties }[];
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

/** Small preset key showing a color chip; a native radio carries the choice. */
export function Swatch({
  name, label, color, checked, onSelect,
}: { name: string; label: string; color: string; checked: boolean; onSelect: () => void }) {
  return (
    <label className="swatch">
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      <span className="swatch-key" aria-hidden>
        <span className="swatch-chip" style={{ background: color }} />
        <span className="led" />
      </span>
      <span className="swatch-label">{label}</span>
    </label>
  );
}
