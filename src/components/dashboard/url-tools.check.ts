// Run: npx tsx src/components/dashboard/url-tools.check.ts
import assert from "node:assert/strict";
import { DEFAULT_SITE, siteSchema, type Link, type Site } from "@/lib/site";
import {
  blockedIp, bulkEdit, cleanUrl, destKey, importRows, parseCsv, restoreLinks, sameDestination, sheetCsvUrl, titleFrom,
} from "./url-tools";

/* cleanUrl */
const SHEET = "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit?gid=123#gid=123";
const glued = "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit?gi" + SHEET + "d=123#gid=123";
assert.deepEqual(cleanUrl(glued), { url: SHEET, changes: ["URL ganda diperbaiki"] });
assert.equal(cleanUrl("https://a.id/xhttps://b.id/y").url, "https://b.id/y");
assert.equal(cleanUrl("https://web.archive.org/web/2020/https://a.id").url, "https://web.archive.org/web/2020/https://a.id");
assert.equal(cleanUrl("https://g.co/url?q=https://a.id").url, "https://g.co/url?q=https://a.id");
assert.deepEqual(cleanUrl("  training-she.ppabib.com "), { url: "https://training-she.ppabib.com", changes: ["spasi dibuang", "https:// ditambahkan"] });
assert.equal(cleanUrl("x.id/a?utm_source=wa&id=7&fbclid=Z#top").url, "https://x.id/a?id=7#top");
assert.equal(cleanUrl("https://docs.google.com/document/d/1AbCdEfGhIj/edit?usp=sharing&resourcekey=0-k").url,
  "https://docs.google.com/document/d/1AbCdEfGhIj/edit?resourcekey=0-k");
assert.equal(cleanUrl("https://docs.google.com/forms/d/e/1FAIpQLSf/viewform?usp=pp_url&entry.1=a").url,
  "https://docs.google.com/forms/d/e/1FAIpQLSf/viewform?usp=pp_url&entry.1=a");
assert.equal(cleanUrl("https://youtu.be/abc?si=xyz").url, "https://youtu.be/abc");
assert.deepEqual(cleanUrl("mailto:a@b.id"), { url: "mailto:a@b.id", changes: [] });
assert.deepEqual(cleanUrl("https://a.id/x"), { url: "https://a.id/x", changes: [] });

/* sameDestination */
assert.ok(sameDestination(SHEET, "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/htmlview?usp=sharing#gid=123"));
assert.ok(!sameDestination(SHEET, "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit#gid=0"));
assert.ok(sameDestination("https://drive.google.com/drive/folders/1AbCdEfGhIjK?usp=sharing", "https://drive.google.com/drive/u/1/folders/1AbCdEfGhIjK"));
assert.ok(sameDestination("https://drive.google.com/open?id=1AbCdEfGhIjK", "https://drive.google.com/file/d/1AbCdEfGhIjK/view"));
assert.ok(sameDestination("https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform", "https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform?usp=sf_link"));
assert.ok(sameDestination("http://www.a.id/x/?utm_source=wa", "https://a.id/x"));
assert.ok(!sameDestination("https://a.id/x?id=1", "https://a.id/x?id=2"));
assert.ok(sameDestination("https://a.id/x?b=2&a=1", "https://a.id/x?a=1&b=2"));
assert.notEqual(destKey("https://a.id/x"), destKey("https://b.id/x"));

/* blockedIp */
for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
  "::1", "::", "fd00::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a00:1", "[::1]", "nonsense"])
  assert.ok(blockedIp(ip), ip);
for (const ip of ["8.8.8.8", "142.250.4.100", "172.32.0.1", "2001:4860:4860::8888", "::ffff:8.8.8.8", "2404:6800:4003:c00::64"])
  assert.ok(!blockedIp(ip), ip);

/* titleFrom */
assert.deepEqual(titleFrom("<title>Absensi Harian - Google Forms</title>"), { ok: true, judul: "Absensi Harian", catatan: "Google Forms" });
assert.deepEqual(titleFrom(`<meta content="Data &amp; Laporan" property="og:title"><title>x</title>`), { ok: true, judul: "Data & Laporan", catatan: "" });
assert.deepEqual(titleFrom("<title>Rekap – Google Drive</title>"), { ok: true, judul: "Rekap", catatan: "Google Drive" });
assert.equal(titleFrom("<title>Google Sheets: Sign-in</title>").ok, false);
assert.deepEqual(titleFrom("<title>Sign in - Google Accounts</title>"), { ok: false, error: "Halaman butuh login, isi judul manual" });
assert.equal((titleFrom(`<title>${"a".repeat(60)}</title>`) as { judul: string }).judul.length, 48);
assert.equal(titleFrom("<p>no title</p>").ok, false);

/* parseCsv */
assert.deepEqual(parseCsv('﻿a,b\r\n"x, ""y""","line1\nline2"\n\n1,\n'), [["a", "b"], ['x, "y"', "line1\nline2"], ["1", ""]]);
assert.deepEqual(parseCsv("a,b"), [["a", "b"]]);

/* sheetCsvUrl */
assert.equal(sheetCsvUrl(SHEET), "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/export?format=csv&gid=123");
assert.equal(sheetCsvUrl("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit"), "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/export?format=csv&gid=0");
assert.equal(sheetCsvUrl("https://example.com/spreadsheets/d/1AbCdEfGhIjKlMnOp"), undefined);

/* importRows */
const k = (id: string, nama: string) => ({ id, nama, warna: "green" as const, ikon: "umum" as const });
const l = (id: string, url: string, extra: Partial<Link> = {}): Link =>
  ({ id, judul: id, url, kategori: "a", kategoriLain: [], catatan: "", kataKunci: "", panduan: "", arsip: false, utama: false, ...extra });
const site: Site = {
  ...DEFAULT_SITE,
  kategori: [k("a", "Absensi"), k("b", "Bantuan"), k("c", "Cuti")],
  link: [l("one", "https://one.id/", { utama: true }), l("two", "https://two.id", { arsip: true }), l("three", "https://three.id", { kategoriLain: ["c"] })],
};
let n = 0;
const csv = parseCsv([
  "Title,Link,KATEGORI,Kata_Kunci,Label",
  "Baru,new.id?utm_source=x,bantuan,apd,Promo",
  "Lama,https://www.one.id,a,,",
  "Arsip,https://two.id/,a,,",
  "Ulang,https://new.id,b,,",
  "Rusak,javascript:alert(1),a,,",
  ",https://notitle.id,a,,",
  "Asing,https://asing.id,gudang,,huh",
].join("\n"));
const imp = importRows(csv, site, "2026-10-24", () => `n${++n}`);
assert.equal(imp.error, undefined);
assert.deepEqual(imp.rows.map((r) => r.status), ["baru", "duplikat", "duplikat", "duplikat", "error", "error", "baru"]);
assert.deepEqual(imp.rows.map((r) => r.line), [2, 3, 4, 5, 6, 7, 8]);
assert.equal(imp.rows[0]!.link.url, "https://new.id");
assert.deepEqual([imp.rows[0]!.link.kategori, imp.rows[0]!.link.kataKunci, imp.rows[0]!.link.label, imp.rows[0]!.link.dibuat], ["b", "apd", "promo", "2026-10-24"]);
assert.equal(imp.rows[2]!.note, "two (arsip)");
assert.equal(imp.rows[3]!.note, "baris 2");
assert.deepEqual([imp.rows[6]!.link.kategori, imp.rows[6]!.katRaw, imp.rows[6]!.link.label], ["", "gudang", undefined]);
assert.match(importRows(parseCsv("judul,kategori\nx,a"), site, "2026-10-24", () => "z").error!, /url/);

/* bulkEdit + restoreLinks */
const ids = new Set(["one", "three"]);
const moved = bulkEdit(site, ids, { kind: "kategori", kategori: "c" });
assert.deepEqual(moved.link.map((x) => [x.kategori, x.kategoriLain]), [["c", []], ["a", []], ["c", []]]);
const lain = bulkEdit(site, ids, { kind: "lain", kategori: "b", add: true });
assert.deepEqual(lain.link.map((x) => x.kategoriLain), [["b"], [], ["b", "c"]]);
assert.deepEqual(bulkEdit(lain, ids, { kind: "lain", kategori: "b", add: false }).link.map((x) => x.kategoriLain), [[], [], ["c"]]);
assert.deepEqual(bulkEdit(site, ids, { kind: "lain", kategori: "a", add: true }).link[0]!.kategoriLain, []); // own lane: no-op
const lbl = bulkEdit(site, ids, { kind: "label", label: "promo", sampai: "2026-11-01" });
assert.deepEqual([lbl.link[0]!.label, lbl.link[0]!.labelSampai, lbl.link[1]!.label], ["promo", "2026-11-01", undefined]);
assert.equal(bulkEdit(lbl, ids, { kind: "label", label: undefined, sampai: "2026-11-01" }).link[0]!.labelSampai, undefined);
const arsip = bulkEdit(site, ids, { kind: "arsip", arsip: true });
assert.deepEqual(arsip.link.map((x) => [x.arsip, x.utama]), [[true, false], [true, false], [true, false]]);
assert.ok(siteSchema.safeParse(arsip).success);
const before = site.link.map((link, at) => ({ link, at })).filter((b) => ids.has(b.link.id));
assert.deepEqual(restoreLinks(arsip, before), site);
const gone = bulkEdit(site, ids, { kind: "hapus" });
assert.deepEqual(gone.link.map((x) => x.id), ["two"]);
assert.deepEqual(restoreLinks(gone, before), site);
// Gantry filled meanwhile: the undo brings the link back without utama instead of failing.
const full = { ...gone, link: [...gone.link, l("u1", "https://u1.id", { utama: true }), l("u2", "https://u2.id", { utama: true })] };
const back = restoreLinks(full, before);
assert.equal(back.link.find((x) => x.id === "one")!.utama, false);
assert.ok(siteSchema.safeParse(back).success);

console.log("url-tools.check ok");
