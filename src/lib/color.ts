// Small color math for the faceplate. Hex in, hex out.

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

/** Mix `a` toward `b` by t (0..1). */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Worst contrast of `fg` across every surface it may sit on (e.g. both ends of a gradient). */
export function minContrast(fg: string, surfaces: string[]): number {
  return Math.min(...surfaces.map((s) => contrast(fg, s)));
}

/** Ink tinted from the base hue, dark on light plastics and light on dark ones, ≥4.5:1 on every surface. */
export function inkFor(base: string, surfaces: string[] = [base]): string {
  // Keep a hint of the base hue, deepening the tint until it clears 4.5:1 (pure black/white at worst).
  for (let t = 0.82; t <= 1.0001; t += 0.03) {
    const dark = mix(base, "#000000", t);
    const light = mix(base, "#ffffff", Math.min(1, t + 0.08));
    const best = minContrast(dark, surfaces) >= minContrast(light, surfaces) ? dark : light;
    if (minContrast(best, surfaces) >= 4.5) return best;
  }
  return minContrast("#000000", surfaces) >= minContrast("#ffffff", surfaces) ? "#000000" : "#ffffff";
}

/** Secondary ink: as soft as possible while keeping 4.5:1 on every surface. */
export function softInkFor(base: string, ink: string, surfaces: string[] = [base]): string {
  for (let t = 0.4; t > 0; t -= 0.05) {
    const c = mix(ink, base, t);
    if (minContrast(c, surfaces) >= 4.5) return c;
  }
  return ink;
}
