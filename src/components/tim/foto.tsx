"use client";

import { useEffect, useRef, useState } from "react";
import { inisial } from "./tim";

/** Initials on a yellow diamond warning sign: the stand-in when there is no photo. */
export function Inisial({ nama, size = 72 }: { nama: string; size?: number }) {
  return (
    <svg className="inisial" viewBox="0 0 72 72" width={size} height={size} aria-hidden focusable="false">
      <rect x="12" y="12" width="48" height="48" rx="5" transform="rotate(45 36 36)" fill="var(--black)" />
      <rect x="16.5" y="16.5" width="39" height="39" rx="3" transform="rotate(45 36 36)" fill="var(--yellow)" />
      <text x="36" y="37" textAnchor="middle" dominantBaseline="central">{inisial(nama)}</text>
    </svg>
  );
}

/** A member's photo, or their initials sign when there is none or it fails to load. Decorative: the name sits beside it. */
export function Foto({ src, nama, size = 72 }: { src: string; nama: string; size?: number }) {
  // The src that failed, so a new src (admin preview while typing) gets its own try.
  const [failed, setFailed] = useState("");
  const img = useRef<HTMLImageElement>(null);
  // An image that failed before hydration fired its error with no listener attached yet.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && !el.naturalWidth) setFailed(src);
  }, [src]);

  if (!src || failed === src) return <Inisial nama={nama} size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- any https host the admin pastes; next/image would need each one allow-listed
    <img ref={img} className="foto" src={src} alt="" width={size} height={size} loading="lazy" decoding="async"
      referrerPolicy="no-referrer" onError={() => setFailed(src)} />
  );
}
