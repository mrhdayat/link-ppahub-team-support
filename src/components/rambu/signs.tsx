import type { ReactNode } from "react";
import type { Ikon } from "@/lib/site";

/** Drawn sign shapes. Decorative unless a caller gives them a label. */

export function Arrow({ dir = "right", className = "" }: { dir?: "right" | "up-right" | "down"; className?: string }) {
  const rot = dir === "up-right" ? -45 : dir === "down" ? 90 : 0;
  return (
    <svg className={`arrow ${className}`} viewBox="0 0 48 48" aria-hidden focusable="false">
      <g transform={`rotate(${rot} 24 24)`}>
        <path d="M6 20h22V9l16 15-16 15V28H6z" fill="currentColor" />
      </g>
    </svg>
  );
}

const OCT = (r: number, c = 60) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) * (2 * i + 1);
    return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

export function Octagon() {
  return (
    <svg className="octagon" viewBox="0 0 120 120" aria-hidden focusable="false">
      <polygon points={OCT(58)} fill="var(--black)" />
      <polygon points={OCT(53)} fill="var(--white)" />
      <polygon points={OCT(48)} fill="var(--red)" />
    </svg>
  );
}

export function UTurn() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden focusable="false">
      <path d="M14 42V20a10 10 0 0 1 20 0v8" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
      <path d="M25 26h18L34 38z" fill="currentColor" />
    </svg>
  );
}

export function SunMoon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
        <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
      </g>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="currentColor" />
    </svg>
  );
}

/** Lane pictograms, drawn like road-sign symbols: bold, flat, one colour (currentColor). */
const IKON_PATH: Record<Ikon, ReactNode> = {
  // bookmark holding a chain link: saved links
  simpan: (
    <>
      <path d="M5 2h14v20l-7-5-7 5z" fill="currentColor" />
      <g fill="none" stroke="var(--ikon-cut, #fff)" strokeWidth="2" strokeLinecap="round">
        <path d="M10.6 11.4a2.4 2.4 0 0 1 0-3.4l1.4-1.4a2.4 2.4 0 0 1 3.4 3.4l-.8.8" />
        <path d="M13.4 8.6a2.4 2.4 0 0 1 0 3.4L12 13.4A2.4 2.4 0 0 1 8.6 10l.8-.8" />
      </g>
    </>
  ),
  // high-voltage bolt
  listrik: <path d="M14.5 1 4 13.5h6.5L8.5 23 20 9.5h-6.6z" fill="currentColor" />,
  // water drop with an outflow wave: pumping water out of the pit
  air: (
    <>
      <path d="M12 1.5C8 7 5.5 10.6 5.5 14a6.5 6.5 0 0 0 13 0c0-3.4-2.5-7-6.5-12.5z" fill="currentColor" />
      <path d="M8.5 14.6c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0" fill="none" stroke="var(--ikon-cut, #fff)" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // hauler truck, side view
  truk: (
    <>
      <path d="M1 5h13v11H1zM15 8.5h4.2L23 12.6V16h-8z" fill="currentColor" />
      <circle cx="5.5" cy="18" r="2.6" fill="currentColor" stroke="var(--ikon-cut, #fff)" strokeWidth="1.4" />
      <circle cx="18" cy="18" r="2.6" fill="currentColor" stroke="var(--ikon-cut, #fff)" strokeWidth="1.4" />
    </>
  ),
  // spanner
  alat: <path d="M21.2 6.3 17.6 9.9l-3.4-.6-.6-3.4 3.6-3.6a6 6 0 0 0-7.6 7.5L2.5 16.9a2.4 2.4 0 0 0 3.4 3.4l7.1-7.1a6 6 0 0 0 8.2-6.9z" fill="currentColor" />,
  // form / document
  dokumen: (
    <>
      <path d="M4 1h11l5 5v17H4z" fill="currentColor" />
      <path d="M8 11h8M8 15h8M8 19h5" stroke="var(--ikon-cut, #fff)" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // safety shield with a tick
  perisai: (
    <>
      <path d="M12 1 3 4.5v6.3C3 16.4 6.9 21.2 12 23c5.1-1.8 9-6.6 9-12.2V4.5z" fill="currentColor" />
      <path d="m7.8 12 3 3 5.4-5.6" fill="none" stroke="var(--ikon-cut, #fff)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // map pin
  umum: (
    <>
      <path d="M12 1a8 8 0 0 0-8 8c0 5.6 8 14 8 14s8-8.4 8-14a8 8 0 0 0-8-8z" fill="currentColor" />
      <circle cx="12" cy="9" r="3" fill="var(--ikon-cut, #fff)" />
    </>
  ),
};

export const IKON_NAMA: Record<Ikon, string> = {
  simpan: "Simpan tautan",
  listrik: "Listrik / high voltage",
  air: "Air / dewatering",
  truk: "Truk",
  alat: "Peralatan",
  dokumen: "Formulir",
  perisai: "Keselamatan",
  umum: "Umum",
};

export function KategoriIkon({ ikon, className = "" }: { ikon: Ikon; className?: string }) {
  return (
    <svg className={`k-ikon ${className}`} viewBox="0 0 24 24" aria-hidden focusable="false">
      {IKON_PATH[ikon] ?? IKON_PATH.umum}
    </svg>
  );
}
