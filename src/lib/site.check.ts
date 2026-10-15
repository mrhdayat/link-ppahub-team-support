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
// Times are given in UTC; the owner is on WITA (UTC+8), whatever the visitor's machine says.
const st = DEFAULT_SITE.status; // 9–21 WITA, Sunday off
const wita = (d: number, h: number) => new Date(Date.UTC(2026, 9, d, h - 8));
assert.equal(statusAt(st, wita(15, 10)), "hijau"); // Thursday 10:00 WITA
assert.equal(statusAt(st, wita(15, 22)), "kuning");
assert.equal(statusAt(st, wita(18, 10)), "merah"); // Sunday
assert.equal(statusAt(st, wita(15, 6)), "kuning"); // 06:00 WITA is 05:00 WIB / 22:00 UTC the day before
assert.equal(statusAt({ ...st, zona: "Asia/Jakarta" }, wita(15, 9)), "kuning", "09:00 WITA is 08:00 WIB: not open yet in Jakarta");
assert.equal(statusAt({ ...st, mode: "manual", manual: "kuning" }, wita(15, 10)), "kuning");
// Old stored data without a zone gets the default.
assert.equal(siteSchema.parse({ ...DEFAULT_SITE, status: { ...st, zona: undefined } }).status.zona, "Asia/Makassar");

// Analytics day window is zero-filled and ends today in the owner's zone.
import("./analytics").then(({ lastDays, totals, linkTaps }) => {
  const days = [{ day: "2026-10-14", counts: { view: 3, "l:l1": 2 } }, { day: "2026-10-15", counts: { "l:l1": 1, "l:l3": 4, wa: 1 } }];
  const w = lastDays(days, 7, "Asia/Makassar", new Date(Date.UTC(2026, 9, 15, 4)));
  assert.equal(w.length, 7);
  assert.equal(w[6].day, "2026-10-15");
  assert.equal(w[0].day, "2026-10-09");
  assert.deepEqual(w[5].counts, { view: 3, "l:l1": 2 });
  assert.equal(totals(days)["l:l1"], 3);
  assert.equal(linkTaps(days[1].counts), 5);
  console.log("site.check ok");
});
