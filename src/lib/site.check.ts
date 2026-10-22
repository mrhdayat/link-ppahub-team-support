// Self-check: `npx tsx src/lib/site.check.ts`
import assert from "node:assert/strict";
import { lastDays, linkTaps, totals, type Day } from "./analytics";
import { DEFAULT_SITE, activeLabel, buka24, isOfficeOnly, labelFor, lanesOf, linksIn, nextShift, safetyTalkFor, temaFor, isSafeUrl, laneLayout, parseSite, siteSchema, statusAt } from "./site";

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
const l = { ...DEFAULT_SITE.link[0], label: "baru" as const, labelSampai: "2026-12-31" };
assert.equal(activeLabel(l, "2026-12-31"), "baru");
assert.equal(activeLabel(l, "2027-01-01"), undefined);

// Status lamp: open hours, closed hours, day off, manual override.
// Times are given in UTC; the owner is on WITA (UTC+8), whatever the visitor's machine says.
// A fixed schedule: the seed's own hours follow whatever the admin last set.
const st = { ...DEFAULT_SITE.status, mode: "otomatis" as const, zona: "Asia/Makassar" as const, jamBuka: 9, jamTutup: 21, hariLibur: [0] }; // 9–21 WITA, Sunday off
const wita = (d: number, h: number) => new Date(Date.UTC(2026, 9, d, h - 8));
assert.equal(statusAt(st, wita(15, 10)), "hijau"); // Thursday 10:00 WITA
assert.equal(statusAt(st, wita(15, 22)), "kuning");
assert.equal(statusAt(st, wita(18, 10)), "merah"); // Sunday
assert.equal(statusAt(st, wita(15, 6)), "kuning"); // 06:00 WITA is 05:00 WIB / 22:00 UTC the day before
assert.equal(statusAt({ ...st, zona: "Asia/Jakarta" }, wita(15, 9)), "kuning", "09:00 WITA is 08:00 WIB: not open yet in Jakarta");
assert.equal(statusAt({ ...st, mode: "manual", manual: "kuning" }, wita(15, 10)), "kuning");
// Stored categories from before icons existed get the generic one; the seed has an icon per category.
assert.equal(siteSchema.parse({ ...DEFAULT_SITE, kategori: DEFAULT_SITE.kategori.map(({ ikon: _, ...k }) => k) }).kategori[0].ikon, "umum");
assert.deepEqual(DEFAULT_SITE.kategori.map((k) => k.ikon), ["simpan", "listrik", "air", "truk"]);
// 00–24 is open around the clock (green all day, except a day off).
const allDay = { ...st, jamBuka: 0, jamTutup: 24 };
assert.ok(buka24(allDay) && !buka24(st));
assert.equal(statusAt(allDay, wita(15, 0)), "hijau");
assert.equal(statusAt(allDay, wita(15, 23)), "hijau");
assert.equal(statusAt(allDay, wita(18, 12)), "merah"); // Sunday is still a day off
// Extra lanes, automatic BARU, office-only links, K3 rotation, shift countdown, calendar themes.
{
  const base = { ...DEFAULT_SITE.link[0], kategoriLain: [] as string[] };
  const multi = { ...base, kategoriLain: [DEFAULT_SITE.kategori[1].id, base.kategori] };
  assert.deepEqual(lanesOf(multi), [base.kategori, DEFAULT_SITE.kategori[1].id], "own lane first, no repeats");
  assert.equal(bad({ link: [{ ...base, kategoriLain: ["tidak-ada"] }] }), false, "unknown extra lane");
  const s2 = { ...DEFAULT_SITE, link: [multi] };
  assert.equal(linksIn(s2, DEFAULT_SITE.kategori[1].id).length, 1);
  const fresh = { ...base, label: undefined, dibuat: "2026-10-20" };
  assert.equal(labelFor(fresh, "2026-10-20"), "baru");
  assert.equal(labelFor(fresh, "2026-10-26"), "baru");
  assert.equal(labelFor(fresh, "2026-10-27"), undefined, "BARU lasts 7 days");
  assert.equal(labelFor({ ...fresh, label: "promo" }, "2026-10-21"), "promo", "admin label wins");
  assert.equal(labelFor({ ...base, label: undefined, dibuat: undefined }, "2026-10-21"), undefined);
  for (const u of ["http://172.16.0.248/vms/", "http://10.1.2.3", "http://192.168.1.10:8080", "http://localhost:3000", "http://nas.local"]) assert.ok(isOfficeOnly(u), u);
  for (const u of ["http://103.88.153.214:8084/vms/", "http://172.32.0.1", "https://docs.google.com"]) assert.ok(!isOfficeOnly(u), u);
  const talks = [{ teks: "A" }, { teks: "B" }, { teks: "Hari K3", tanggal: "2026-10-22" }];
  assert.equal(safetyTalkFor(talks, "2026-10-22"), "Hari K3");
  assert.notEqual(safetyTalkFor(talks, "2026-10-23"), safetyTalkFor(talks, "2026-10-24"), "undated ones rotate daily");
  assert.equal(safetyTalkFor([], "2026-10-22"), undefined);
  assert.deepEqual(nextShift(["06:00", "18:00"], 17, 30), { at: "18:00", minutes: 30 });
  assert.deepEqual(nextShift(["06:00", "18:00"], 23, 0), { at: "06:00", minutes: 420 }, "wraps past midnight");
  assert.deepEqual(nextShift(["06:00"], 6, 0), { at: "06:00", minutes: 1440 }, "exactly at change: next one is tomorrow");
  assert.equal(temaFor("otomatis", "2026-08-17"), "hut-ri");
  assert.equal(temaFor("otomatis", "2026-01-12"), "bulan-k3");
  assert.equal(temaFor("otomatis", "2026-02-13"), "standar");
  assert.equal(temaFor("hut-ppa", "2026-08-17"), "hut-ppa", "manual pick wins");
  // Stored data from before these fields parses with defaults.
  const old = siteSchema.parse({ ...DEFAULT_SITE, safetyTalk: undefined, shift: undefined, cuaca: undefined, tema: undefined });
  assert.deepEqual(old.shift, ["06:00", "18:00"]);
  assert.equal(old.tema, "otomatis");
}
// Old stored data without a zone gets the default.
assert.equal(siteSchema.parse({ ...DEFAULT_SITE, status: { ...st, zona: undefined } }).status.zona, "Asia/Makassar");

// Analytics day window is zero-filled and ends today in the owner's zone.
const days: Day[] = [
  { day: "2026-10-14", counts: { view: 3, "l:l1": 2 } },
  { day: "2026-10-15", counts: { "l:l1": 1, "l:l3": 4, wa: 1 } },
];
const w = lastDays(days, 7, "Asia/Makassar", new Date(Date.UTC(2026, 9, 15, 4)));
assert.equal(w.length, 7);
assert.equal(w[6].day, "2026-10-15");
assert.equal(w[0].day, "2026-10-09");
assert.deepEqual(w[5].counts, { view: 3, "l:l1": 2 });
assert.equal(totals(days)["l:l1"], 3);
assert.equal(linkTaps(days[1].counts), 5);

console.log("site.check ok");
