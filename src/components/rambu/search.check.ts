// Run: npx tsx src/components/rambu/search.check.ts
import assert from "node:assert/strict";
import { linkSchema } from "@/lib/site";
import { dl, norm, search } from "./search";

assert.equal(norm("Pérmit ÉLEKTRIK"), "permit elektrik");
assert.equal(dl("monitoring", "monitoring"), 0);
assert.equal(dl("monitorign", "monitoring"), 1); // swapped neighbours count once
assert.equal(dl("kitten", "sitting"), 3);

const L = (id: string, judul: string, more: Record<string, unknown> = {}) =>
  linkSchema.parse({ id, judul, url: "https://x.id", kategori: "hv", ...more });
const links = [
  L("a", "Purchasing Monitoring System", { catatan: "Apps Script" }),
  L("b", "Simper Permit", { kataKunci: "izin, sim" }),
  L("c", "Monitoring Pompa", { kategori: "dw" }),
  L("d", "Permintaan APD", { catatan: "Form permit lama", kataKunci: "sepatu, helm" }),
  L("e", "Café Résumé"),
];
const lane = (id: string) => ({ hv: "High Voltage", dw: "Dewatering" })[id];
const ids = (q: string) => search(links, lane, q).map((h) => h.link.id);

assert.deepEqual(ids(""), []);
assert.deepEqual(ids("   "), []);
// exact word, then a title hit before a note hit at the same rank
assert.deepEqual(ids("permit"), ["b", "d"]);
// prefix while typing
assert.deepEqual(ids("monit"), ["a", "c"]);
// every word must match
assert.deepEqual(ids("monitoring pompa"), ["c"]);
// aliases and lane names
assert.deepEqual(ids("helm"), ["d"]);
assert.deepEqual(ids("izin"), ["b"]);
assert.deepEqual(ids("dewatering"), ["c"]);
// typos: 1 from 4 letters, 2 from 8, none below 4
assert.deepEqual(ids("monitorign"), ["a", "c"]);
assert.deepEqual(ids("purchsing"), ["a"]);
assert.deepEqual(ids("prchsing"), ["a"]); // 2 typos, 8 letters
assert.deepEqual(ids("sepatuu"), ["d"]); // typo in an alias
assert.deepEqual(ids("pmp"), []); // too short to guess
// exact beats prefix beats alias beats fuzzy
const rank = search([L("f", "Simulasi"), L("g", "Sim Card"), L("h", "Lain", { kataKunci: "sim" }), L("i", "Sum")], lane, "sim").map((h) => h.link.id);
assert.deepEqual(rank, ["g", "f", "h"]);
const fuzzyLast = search([L("j", "Pernit"), L("k", "Xyz", { kataKunci: "permit" }), L("l", "Permit")], lane, "permit").map((h) => h.link.id);
assert.deepEqual(fuzzyLast, ["l", "k", "j"]);
// diacritics: query and text both folded; marks map back onto the original text
assert.deepEqual(ids("resume"), ["e"]);
const [cafe] = search(links, lane, "résu");
assert.deepEqual(cafe.judul, [[5, 9]]);
assert.equal("Café Résumé".slice(5, 9), "Résu");
// highlight ranges: title words, merged; note when the title didn't match
const [a] = search(links, lane, "monitoring system");
assert.deepEqual(a.judul, [[11, 21], [22, 28]]);
const [, d] = search(links, lane, "permit");
assert.deepEqual(d.judul, []);
assert.deepEqual(d.catatan, [[5, 11]]);
// a fuzzy hit marks the whole word it matched
assert.deepEqual(search(links, lane, "purchsing")[0].judul, [[0, 10]]);

console.log("search.check ok");
