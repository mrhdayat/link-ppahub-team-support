"use client";

import { useEffect, useRef, useState } from "react";

/** Avatar for the driver cone. Falls back to initials when the URL fails, including failures before hydration. */
export function ConeAvatar({ src, initials }: { src: string; initials: string }) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setBroken(true);
  }, []);

  if (broken) return <span aria-hidden>{initials}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL or inline data image
  return <img ref={img} src={src} alt="" width={96} height={96} onError={() => setBroken(true)} />;
}
