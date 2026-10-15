import type { CSSProperties } from "react";

/**
 * The service bench: a fixed palette, independent of the admin's picks, so the editor stays legible
 * whatever paint and glow the page wears. Prefixed --b- so none of it leaks into the preview's scene.
 */
export const PANEL = {
  "--b-ground": "#1b1e21", // pegboard
  "--b-hole": "#0b0c0e",
  "--b-strip": "#141619", // top bar and save bar: black anodized rail
  "--b-plate-hi": "#d2d7dc", // steel plate, brushed
  "--b-plate": "#bfc6cd",
  "--b-plate-lo": "#a9b1b9",
  "--b-edge": "#5d646d",
  "--b-ink": "#14171a",
  "--b-ink-soft": "#30363c", // ≥ 4.5:1 on every plate tone
  "--b-card": "#fbfaf5", // label card
  "--b-rubber-hi": "#3b4046",
  "--b-rubber": "#2a2e33",
  "--b-rubber-lo": "#111316",
  "--b-key-ink": "#f1f3f5",
  "--b-tape": "#17191c",
  "--b-tape-ink": "#f3f3ef",
  "--b-led": "#3ddc84",
  "--b-led-off": "#3c4248",
  "--b-amber": "#ffb547",
  "--b-danger": "#8c1d17", // text on steel and on card
  "--b-danger-hot": "#ff7a6e", // glyphs and text on dark rubber or strip
  "--b-vfd": "#090b0c",
  "--b-vfd-glow": "#5ef2c8",
  "--b-chrome-1": "#f7f8fa",
  "--b-chrome-2": "#b6bdc5",
  "--b-chrome-3": "#5d646d",
  colorScheme: "dark",
} as CSSProperties;
