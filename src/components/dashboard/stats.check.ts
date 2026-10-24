// Run: npx tsx src/components/dashboard/stats.check.ts
import assert from "node:assert/strict";
import { SRC_MAX, deviceOf, isLinkKey as serverIsLinkKey, isSrcKey, srcFits, type Day, type HourRow } from "@/lib/analytics";
import { DEFAULT_SITE, anggotaSchema, siteSchema, type Site } from "@/lib/site";
import {
  addDays, ago, asalKunjungan, bucket, busiest, busyLabel, change, diffSummary, hourGrid, isLinkKey, linkTaps, perKategori, span, sum, ticks,
  perangkat, weekdayOf, weekly, weeklyText,
} from "./stats";
import { inisial, keTelp, keWa, kelompokTim, nomorID, tampilNomor } from "@/components/tim/tim";

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

// Sources (#26): lane QR by lane name, unknown lane by id, other slugs as-is, the rest is "Langsung".
const asal = asalKunjungan(site, { view: 20, "src:qr-a": 6, "src:qr": 3, "src:share": 3, "src:wa-grup": 1, "src:qr-gone": 1, "src:x": 0, "l:x": 9 });
assert.deepEqual(asal.rows.map((r) => [r.label, r.n]), [
  ["QR jalur Alfa", 6], ["Dibagikan", 3], ["QR halaman", 3], ["Lainnya: wa-grup", 1], ["QR jalur gone", 1], ["Langsung/tanpa sumber", 6],
]);
assert.equal(asal.tagged, 14);
assert.equal(asal.rows[0]!.share, 30);
assert.equal(asal.rows.reduce((s, r) => s + r.share, 0), 100);
// More tagged than views (old days): no negative "Langsung", shares of the tagged.
const asal2 = asalKunjungan(site, { view: 1, "src:qr": 2 });
assert.deepEqual(asal2.rows.map((r) => [r.key, r.n, r.share]), [["src:qr", 2, 100]]);
assert.deepEqual(asalKunjungan(site, {}).rows, []);
assert.deepEqual(asalKunjungan(site, { view: 4 }).rows.map((r) => [r.key, r.share]), [["langsung", 100]]);

// Devices (#28): fixed order, shares of the device total.
const dev = perangkat({ view: 9, "dev:mobile": 6, "dev:desktop": 2 });
assert.deepEqual(dev.rows.map((r) => [r.key, r.n, r.share]), [["mobile", 6, 75], ["tablet", 0, 0], ["desktop", 2, 25]]);
assert.equal(perangkat({}).total, 0);
// New key families never count as link clicks, on either side.
for (const k of ["src:qr", "dev:mobile"]) assert.ok(!isLinkKey(k) && !serverIsLinkKey(k));
assert.equal(linkTaps({ "l:x": 2, "src:qr": 5, "dev:mobile": 5, view: 5 }), 2);

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidPhone: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  firefoxPhone: "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
  androidTab: "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  ipadOld: "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
  ipadDesktopUa: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
};
assert.equal(deviceOf(UA.iphone), "mobile");
assert.equal(deviceOf(UA.androidPhone), "mobile");
assert.equal(deviceOf(UA.firefoxPhone), "mobile");
assert.equal(deviceOf(UA.androidTab), "tablet");
assert.equal(deviceOf(UA.ipadOld), "tablet");
assert.equal(deviceOf(UA.ipadDesktopUa), "desktop"); // documented limit: iPadOS desktop UA
assert.equal(deviceOf(UA.windows), "desktop");
assert.equal(deviceOf(""), "desktop");

// src keys: slug shape, and at most SRC_MAX distinct slugs a day (known ones keep counting).
assert.ok(isSrcKey("src:qr") && isSrcKey("src:qr-high-voltage") && isSrcKey(`src:qr-${"a".repeat(24)}`));
for (const k of ["src:", "src:QR", "src:a b", "src:a_b", `src:${"a".repeat(28)}`, "qr"]) assert.ok(!isSrcKey(k), k);
const full = Array.from({ length: SRC_MAX }, (_, i) => `src:s${i}`);
assert.ok(srcFits(full.slice(1), "src:new"));
assert.ok(!srcFits(full, "src:new"));
assert.ok(srcFits(full, "src:s7"));
assert.ok(srcFits([...full.slice(1), "view", "l:x"], "src:new")); // other keys don't use up the room

// Team page (#14): whole team first (incl. members of a deleted lane), then lanes in category order, empty lanes skipped.
const orang = (id: string, jalur: string) => anggotaSchema.parse({ id, nama: `Orang ${id}`, jalur });
const grup = kelompokTim({ kategori: site.kategori, tim: [orang("1", "b"), orang("2", ""), orang("3", "b"), orang("4", "gone")] });
assert.deepEqual(grup.map((g) => [g.id, g.anggota.map((a) => a.id)]), [["", ["2", "4"]], ["b", ["1", "3"]]]);
assert.deepEqual(kelompokTim({ kategori: site.kategori, tim: [] }), []);
assert.equal(inisial("budi santoso wibowo"), "BS");
assert.equal(inisial("  Ani "), "AN");
// Phone numbers: 08…, +62…, 62…, stored forms; normalised to what the schema accepts.
for (const n of ["0812-3456-7890", "+62 812 3456 7890", "6281234567890", "https://wa.me/6281234567890", "tel:+6281234567890", "(0812) 3456.7890"])
  assert.equal(nomorID(n), "6281234567890", n);
for (const n of ["12345", "0812", "+1 415 555 0100", "abc", "08123456789012345"]) assert.equal(nomorID(n), null, n);
assert.equal(keWa("0812 3456 7890"), "https://wa.me/6281234567890");
assert.equal(keTelp("0812 3456 7890"), "tel:+6281234567890");
assert.equal(keWa(" "), "");
assert.equal(keTelp("nope"), null);
assert.equal(tampilNomor("https://wa.me/6281234567890"), "+6281234567890");
assert.equal(tampilNomor(""), "");
const ok = anggotaSchema.safeParse({ id: "a", nama: "A", wa: keWa("081234567"), telp: keTelp("0511 123456") });
assert.ok(ok.success, "normalised numbers fit anggotaSchema");

const now = Date.parse("2026-10-22T03:00:00Z");
assert.equal(ago("2026-10-22T02:59:30Z", now), "baru saja");
assert.equal(ago("2026-10-22T02:55:00Z", now), "5 menit yang lalu");
assert.equal(ago("2026-10-21T03:00:00Z", now), "kemarin");

console.log("stats.check ok");
