// Run: npx tsx src/components/dashboard/forms.check.ts
import assert from "node:assert/strict";
import { DEFAULT_SITE, siteSchema, type Link, type Site } from "@/lib/site";
import { shiftIssues } from "./controls";
import { dropKategori } from "./kategori";

const k = (id: string) => ({ id, nama: id.toUpperCase(), warna: "green" as const, ikon: "umum" as const });
const l = (id: string, kategori: string, kategoriLain: string[] = []): Link =>
  ({ id, judul: id, url: "https://x.id", kategori, kategoriLain, catatan: "", kataKunci: "", panduan: "", utama: false });
const site: Site = {
  ...DEFAULT_SITE,
  kategori: [k("a"), k("b"), k("c")],
  link: [l("main", "a", ["b"]), l("extra", "b", ["a", "c"]), l("free", "c")],
};

// Main-lane links move to `to` without also keeping it as an extra lane; extra-lane users just lose the lane.
const out = dropKategori(site, "a", "b");
assert.deepEqual(out.kategori.map((x) => x.id), ["b", "c"]);
assert.deepEqual(out.link.map((x) => [x.kategori, x.kategoriLain]), [["b", []], ["b", ["c"]], ["c", []]]);
assert.equal(out.link[2], site.link[2]); // untouched links keep identity
assert.ok(siteSchema.safeParse(out).success);

// Only used as an extra lane: no target needed.
const out2 = dropKategori(site, "c");
assert.deepEqual(out2.link.map((x) => x.kategoriLain), [["b"], ["a"], []]);
assert.equal(out2.link[2]!.kategori, "c"); // the caller refuses this case (main lane, no target)

assert.deepEqual(shiftIssues(["06:00", "18:00"]), []);
assert.deepEqual(shiftIssues(["06:00", "18:00", "06:00", ""]), [{ path: "shift.2", message: "Jam ini sudah ada" }]);

console.log("forms.check ok");
