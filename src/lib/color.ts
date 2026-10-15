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

/** Ink tinted from the base hue, dark on light plastics and light on dark ones. */
export function inkFor(base: string): string {
  // Keep a hint of the base hue, deepening the tint until it clears 4.5:1 (pure black/white at worst).
  for (let t = 0.82; t <= 1.0001; t += 0.03) {
    const dark = mix(base, "#000000", t);
    const light = mix(base, "#ffffff", Math.min(1, t + 0.08));
    const best = contrast(dark, base) >= contrast(light, base) ? dark : light;
    if (contrast(best, base) >= 4.5) return best;
  }
  return contrast("#000000", base) >= contrast("#ffffff", base) ? "#000000" : "#ffffff";
}

/** Secondary ink: as soft as possible while keeping 4.5:1 on the base. */
export function softInkFor(base: string, ink: string): string {
  for (let t = 0.4; t > 0; t -= 0.05) {
    const c = mix(ink, base, t);
    if (contrast(c, base) >= 4.5) return c;
  }
  return ink;
}
