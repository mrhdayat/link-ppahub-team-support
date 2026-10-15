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

export function Diamond({ text }: { text: string }) {
  return (
    <svg className="diamond" viewBox="0 0 120 120" aria-hidden focusable="false">
      <rect x="18" y="18" width="84" height="84" rx="9" transform="rotate(45 60 60)" fill="var(--black)" />
      <rect x="23" y="23" width="74" height="74" rx="6" transform="rotate(45 60 60)" fill="var(--yellow)" />
      <rect x="28" y="28" width="64" height="64" rx="4" transform="rotate(45 60 60)" fill="none" stroke="var(--black)" strokeWidth="3" />
      <text x="60" y="61" textAnchor="middle" dominantBaseline="central" className="diamond-text">{text}</text>
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
