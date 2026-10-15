// Self-check: `npx tsx src/lib/site.check.ts`
import assert from "node:assert/strict";
import { DEFAULT_SITE, activeLabel, isSafeUrl, laneLayout, parseSite, siteSchema, statusAt } from "./site";

// Only openable schemes pass.
assert.ok(isSafeUrl("https://wa.me/62812"));
assert.ok(isSafeUrl("mailto:a@b.co"));
assert.ok(!isSafeUrl("javascript:alert(1)"));
assert.ok(!isSafeUrl("data:text/html,hi"));
assert.ok(!isSafeUrl("example.com"));

// Default is valid; hostile or broken data is refused or falls back.
assert.ok(siteSchema.safeParse(DEFAULT_SITE).success);
const bad = (patch: object) => siteSchema.safeParse({ ...DEFAULT_SITE, ...patch }).success;
assert.equal(bad({ link: [{ ...DEFAULT_SITE.link[0], url: "javascript:alert(1)" }] }), false);
assert.equal(bad({ link: [{ ...DEFAULT_SITE.link[0], kategori: "tidak-ada" }] }), false, "unknown category");
assert.equal(bad({ link: DEFAULT_SITE.link.map((l) => ({ ...l, utama: true })) }), false, "max 2 gantry");
assert.equal(bad({ whatsapp: "https://wa.me/08123" }), false, "wa.me without country code");
assert.deepEqual(parseSite({ profile: { name: "old format" } }), DEFAULT_SITE);

// Lane layout rules from the PRD.
assert.deepEqual(laneLayout(4), { compact: false, visible: 4 });
assert.deepEqual(laneLayout(5), { compact: true, visible: 5 });
assert.deepEqual(laneLayout(6), { compact: true, visible: 6 });
assert.deepEqual(laneLayout(9), { compact: true, visible: 6 });

// Labels expire after labelSampai.
const l = { ...DEFAULT_SITE.link[3] };
assert.equal(activeLabel(l, "2026-12-31"), "baru");
assert.equal(activeLabel(l, "2027-01-01"), undefined);

// Status lamp: open hours, closed hours, day off, manual override.
const st = DEFAULT_SITE.status; // 9–21, Sunday off
assert.equal(statusAt(st, new Date(2026, 9, 15, 10)), "hijau"); // Thursday 10:00
assert.equal(statusAt(st, new Date(2026, 9, 15, 22)), "kuning");
assert.equal(statusAt(st, new Date(2026, 9, 18, 10)), "merah"); // Sunday
assert.equal(statusAt({ ...st, mode: "manual", manual: "kuning" }, new Date(2026, 9, 15, 10)), "kuning");

console.log("site.check ok");
