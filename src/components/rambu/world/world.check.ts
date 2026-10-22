// Self-check: `npx tsx src/components/rambu/world/world.check.ts`
import assert from "node:assert/strict";
import { bacaCuaca, kmDari, kondisi, sisaWaktu, waspada } from "./world";

// WMO codes read as Indonesian site weather.
assert.equal(kondisi(0).teks, "cerah");
assert.equal(kondisi(3).teks, "mendung");
assert.equal(kondisi(61).teks, "hujan ringan");
assert.equal(kondisi(65).lebat, true);
assert.equal(kondisi(82).teks, "hujan lebat");
assert.equal(kondisi(95).langit, "petir");
assert.equal(kondisi(99).lebat, true);
assert.equal(kondisi(61).lebat, false);
assert.equal(kondisi(71).teks, "berawan", "unknown codes stay calm");

// Warning: heavy rain now, or ≥ 60% today or tomorrow.
assert.equal(waspada({ suhu: 30, kode: 2, hujan: [20, 40] }), false);
assert.equal(waspada({ suhu: 30, kode: 2, hujan: [20, 60] }), true);
assert.equal(waspada({ suhu: 30, kode: 95, hujan: [0, 0] }), true);

// Forecast parsing tolerates missing pieces, refuses a broken shape.
const ok = { current: { temperature_2m: 28.4, weather_code: 63 }, daily: { precipitation_probability_max: [70, null] } };
assert.deepEqual(bacaCuaca(ok), { suhu: 28.4, kode: 63, hujan: [70, 0] });
assert.equal(bacaCuaca({ error: true }), undefined);
assert.equal(bacaCuaca(null), undefined);

// Shift countdown copy.
assert.equal(sisaWaktu(85), "1 j 25 m lagi");
assert.equal(sisaWaktu(25), "25 m lagi");
assert.equal(sisaWaktu(120), "2 j lagi");
assert.equal(sisaWaktu(0), "0 m lagi");

// KM post.
assert.equal(kmDari(0), "0,0");
assert.equal(kmDari(400), "0,4");
assert.equal(kmDari(12_345), "12,3");
assert.equal(kmDari(-80), "0,0", "iOS overscroll");

console.log("world.check ok");
