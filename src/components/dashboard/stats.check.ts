// Run: npx tsx src/components/dashboard/stats.check.ts
import assert from "node:assert/strict";
import type { Day, HourRow } from "@/lib/analytics";
import { DEFAULT_SITE, siteSchema, type Site } from "@/lib/site";
import {
  addDays, ago, bucket, busiest, busyLabel, change, diffSummary, hourGrid, linkTaps, perKategori, span, sum, ticks,
  weekdayOf, weekly, weeklyText,
} from "./stats";

assert.equal(addDays("2026-03-01", -1), "2026-02-28");
assert.equal(addDays("2026-12-31", 1), "2027-01-01");

const days: Day[] = [{ day: "2026-10-10", counts: { view: 5, "l:a": 2 } }, { day: "2026-10-12", counts: { view: 1, wa: 1, "l:b": 3 } }];
const w = span(days, "2026-10-12", 4);
assert.deepEqual(w.map((d) => d.day), ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"]);
assert.deepEqual(w[2]!.counts, {}); // zero-filled gap
assert.deepEqual(sum(w), { view: 6, "l:a": 2, wa: 1, "l:b": 3 });
assert.equal(linkTaps(sum(w)), 5);

// Newest bucket is complete; the oldest takes the remainder.
const b = bucket(span(days, "2026-10-12", 10), 7);
assert.deepEqual(b.map((x) => [x.from, x.to]), [["2026-10-03", "2026-10-05"], ["2026-10-06", "2026-10-12"]]);

assert.deepEqual(ticks(0), [0, 1, 2, 3, 4]);
assert.deepEqual(ticks(173), [0, 50, 100, 150, 200]);
assert.ok(ticks(147_413_923).at(-1)! >= 147_413_923);

// Hours: Monday-first rows, range-filtered, only the asked kind.
assert.equal(weekdayOf("2026-10-19"), 0); // Monday
assert.equal(weekdayOf("2026-10-25"), 6); // Sunday
const hours: HourRow[] = [
  { day: "2026-10-22", hour: 7, k: "tap", n: 4 }, // Thursday
  { day: "2026-10-15", hour: 7, k: "tap", n: 3 }, // Thursday a week earlier: outside a 7-day window
  { day: "2026-10-20", hour: 23, k: "tap", n: 2 },
  { day: "2026-10-22", hour: 9, k: "view", n: 9 },
];
const g = hourGrid(hours, "2026-10-16", "2026-10-22", "tap");
assert.equal(g.length, 7);
assert.equal(g[3]![7], 4);
assert.equal(g[1]![23], 2);
assert.equal(g.flat().reduce((a, b) => a + b), 6);
assert.equal(hourGrid(hours, "2026-10-01", "2026-10-22", "tap")[3]![7], 7);
assert.equal(busyLabel(busiest(g)!), "Kamis 07.00–08.00");
assert.equal(busyLabel({ day: 1, hour: 23, n: 1 }), "Selasa 23.00–24.00");
assert.equal(busiest(hourGrid([], "2026-10-16", "2026-10-22", "tap")), null);
// Ties go to the earliest cell in the week.
assert.deepEqual(busiest([[0, 2], [2]]), { day: 0, hour: 1, n: 2 });

// A site with a two-lane link.
const site: Site = siteSchema.parse({
  ...DEFAULT_SITE,
  profil: { ...DEFAULT_SITE.profil, nama: "TEAM SUPPORT" },
  kategori: [
    { id: "a", nama: "Alfa", warna: "blue", ikon: "umum" },
    { id: "b", nama: "Beta", warna: "red", ikon: "umum" },
  ],
  link: [
    { id: "x", judul: "Satu", url: "https://a.test", kategori: "a", kategoriLain: ["b"], dibuat: "2026-10-20" },
    { id: "y", judul: "Dua", url: "https://b.test", kategori: "b" },
    { id: "z", judul: "Tiga", url: "https://c.test", kategori: "a", dibuat: "2026-09-01" },
  ],
});

// Multi-lane links count in every lane.
const pk = perKategori(site, { "l:x": 5, "l:y": 2 });
assert.deepEqual(pk.map((r) => [r.k.id, r.klik, r.links]), [["b", 7, 2], ["a", 5, 2]]);

// Weekly: 16–22 Oct vs 9–15 Oct.
const wdays: Day[] = [
  { day: "2026-10-22", counts: { view: 10, "l:x": 6, "l:y": 6, wa: 3 } },
  { day: "2026-10-16", counts: { view: 10, "l:y": 1 } },
  { day: "2026-10-15", counts: { view: 10, "l:x": 5 } }, // previous week
];
const wk = weekly(site, wdays, hours, "2026-10-22");
assert.deepEqual([wk.from, wk.to, wk.pFrom, wk.pTo], ["2026-10-16", "2026-10-22", "2026-10-09", "2026-10-15"]);
assert.deepEqual([wk.views, wk.pViews, wk.clicks, wk.pClicks], [20, 10, 13, 5]);
assert.equal(wk.ratio, 13 / 20);
assert.deepEqual(wk.top.map((r) => [r.link.id, r.n]), [["y", 7], ["x", 6]]);
assert.deepEqual(wk.baru.map((l) => l.id), ["x"]);
assert.deepEqual(wk.tanpaKlik.map((l) => l.id), ["z"]);
assert.equal(busyLabel(wk.jam!), "Kamis 07.00–08.00");
assert.equal(change(20, 10), "+100%");
assert.equal(change(5, 10), "−50%");
assert.equal(change(3, 0), "+3 dari 0");
assert.equal(change(4, 4), "tetap");
assert.equal(change(null, 1), "belum bisa dibandingkan");
assert.equal(change(2.02, 2, true), "tetap"); // rounds to 0×: never "+0×"
assert.equal(change(2.5, 2, true), "+0,5×");
const text = weeklyText(wk, site.profil.nama);
assert.match(text, /^\*Laporan mingguan TEAM SUPPORT\*/);
assert.match(text, /Kunjungan: 20 \(\+100%\)/);
assert.match(text, /1\. Dua: 7 klik\n2\. Satu: 6 klik/);
assert.match(text, /Tautan baru: Satu/);
assert.match(text, /Tautan tanpa klik: 1/);
assert.match(text, /Jam tersibuk: Kamis 07\.00–08\.00$/);

// History diff, read as "what restoring the old version would do".
assert.deepEqual(diffSummary(site, site), []);
const cur: Site = {
  ...site,
  profil: { ...site.profil, nama: "BARU" },
  kategori: [{ ...site.kategori[0]!, nama: "Alpha" }, site.kategori[1]!],
  link: [{ ...site.link[0]!, judul: "Satu!" }, site.link[1]!, { ...site.link[2]!, id: "w" }],
};
assert.deepEqual(diffSummary(site, cur), ["+1 tautan", "−1 tautan", "1 tautan berubah", "kategori “Alpha” → “Alfa”", "profil berubah"]);
assert.deepEqual(diffSummary(site, { ...site, tampilKlik: !site.tampilKlik }), ["pengaturan lain berubah"]);

const now = Date.parse("2026-10-22T03:00:00Z");
assert.equal(ago("2026-10-22T02:59:30Z", now), "baru saja");
assert.equal(ago("2026-10-22T02:55:00Z", now), "5 menit yang lalu");
assert.equal(ago("2026-10-21T03:00:00Z", now), "kemarin");

console.log("stats.check ok");
