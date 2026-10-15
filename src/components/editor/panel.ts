import type { CSSProperties } from "react";
import { DEFAULT_THEME, themeVars } from "@/lib/site";

// ponytail: interim neutral panel until the editor is restyled for the workshop world.
const vars = themeVars({ ...DEFAULT_THEME, base: "#dfe2e5", led: "#1fb46a", radius: 12, depth: 0.6, font: "archivo" });

/** Admin screens wear a fixed Kapur panel so they stay legible whatever colors the admin picks for the page. */
export const PANEL = vars as CSSProperties;
