import type { CSSProperties } from "react";
import { PRESETS, themeVars } from "@/lib/site";

const { "color-scheme": colorScheme, ...vars } = themeVars({
  preset: "kapur", ...PRESETS.kapur, radius: 12, depth: 0.6, font: "archivo", keyStyle: "raised", grille: false,
});

/** Admin screens wear a fixed Kapur panel so they stay legible whatever colors the admin picks for the page. */
export const PANEL = { ...vars, colorScheme } as CSSProperties;
