// Self-check: `npx tsx src/lib/site.check.ts`
import assert from "node:assert/strict";
import { contrast, minContrast } from "./color";
import { DEFAULT_SITE, PRESETS, isSafeUrl, parseSite, siteSchema, themeVars } from "./site";

// Every preset and a few hostile picks keep body + secondary ink at WCAG AA on the plate
// and on both ends of the key gradient.
const bases = [...Object.values(PRESETS).map((p) => p.base), "#ffffff", "#000000", "#808080", "#ff0000", "#3a7bd5", "#ffff00"];
for (const base of bases) {
  const v = themeVars({ ...DEFAULT_SITE.theme, base });
  const surfaces = [v["--base"], v["--face-top"], v["--face-bottom"]];
  assert.ok(minContrast(v["--ink"], surfaces) >= 4.5, `ink on ${base}`);
  assert.ok(minContrast(v["--ink-soft"], surfaces) >= 4.5, `soft ink on ${base}`);
  // Off LED cells and grille holes must stay visible, even on black.
  assert.ok(contrast(v["--led-off"], v["--base"]) > 1.1, `led-off visible on ${base}`);
}

// Any glow pick stays readable on the VFD glass and visible as a focus ring in the drawer gaps.
for (const base of bases) {
  for (const led of ["#000000", "#202020", "#5ef2c8", "#0000ff", "#ffffff"]) {
    const v = themeVars({ ...DEFAULT_SITE.theme, base, led });
    assert.ok(contrast(v["--glow"], "#060708") >= 4.5, `glow ${led} on glass`);
    assert.ok(contrast(v["--glow"], v["--gap"]) >= 3, `glow ${led} in gaps of ${base}`);
  }
}

// Only openable schemes pass.
assert.ok(isSafeUrl("https://wa.me/62812"));
assert.ok(isSafeUrl("mailto:a@b.co"));
assert.ok(!isSafeUrl("javascript:alert(1)"));
assert.ok(!isSafeUrl("data:text/html,hi"));
assert.ok(!isSafeUrl("example.com"));
assert.equal(siteSchema.safeParse({ ...DEFAULT_SITE, links: [{ ...DEFAULT_SITE.links[0], url: "javascript:alert(1)" }] }).success, false);

// Default is valid; broken stored sections fall back without losing the good ones.
assert.ok(siteSchema.safeParse(DEFAULT_SITE).success);
const mixed = parseSite({ ...DEFAULT_SITE, profile: { name: "Ops" , bio: "", avatar: "" }, theme: { base: "nope" } });
assert.equal(mixed.profile.name, "Ops");
assert.deepEqual(mixed.theme, DEFAULT_SITE.theme);
assert.deepEqual(parseSite(null), DEFAULT_SITE);

console.log("site.check ok");
