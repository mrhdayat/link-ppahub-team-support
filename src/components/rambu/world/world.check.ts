// Self-check: `npx tsx src/components/rambu/world/world.check.ts`
import assert from "node:assert/strict";
import { awasHujan, bacaBmkg, bacaCuaca, bacaMatahari, gabung, hitungMatahari, kmDari, kondisi, kondisiBmkg, localStamp, malam, sisaWaktu, waspada } from "./world";

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

// BMKG reading + merge with Open-Meteo.
{
  const slot = (dt: string, t: number, weather: number, desc: string, tp = 0) => ({ local_datetime: dt, t, weather, weather_desc: desc, tp });
  const j = {
    lokasi: { timezone: "Asia/Makassar" },
    data: [{ cuaca: [
      [slot("2026-10-22 12:00:00", 33, 3, "Berawan"), slot("2026-10-22 15:00:00", 34, 61, "Hujan Sedang", 6.5), slot("2026-10-22 18:00:00", 27, 60, "Hujan Ringan", 1.5)],
      [slot("2026-10-23 00:00:00", 25, 63, "Hujan Lebat", 22), slot("2026-10-23 03:00:00", 24, 3, "Berawan", 0.4)],
    ] }],
  };
  // 16:10 WITA = 08:10 UTC: the 15:00 slot covers now.
  const b = bacaBmkg(j, new Date("2026-10-22T08:10:00Z"))!;
  assert.deepEqual(b, { suhu: 34, kode: 61, teks: "hujan sedang", mm: [8, 22.4] });
  assert.equal(bacaBmkg(j, new Date("2026-10-22T02:00:00Z"))!.suhu, 33, "before the first slot: first slot");
  assert.equal(bacaBmkg({ status: 403 }, new Date()), undefined);
  assert.equal(localStamp(new Date("2026-10-22T08:10:00Z"), "Asia/Makassar"), "2026-10-22 16:10:00");
  assert.equal(kondisiBmkg(97).langit, "petir");
  assert.equal(kondisiBmkg(63).lebat, true);
  assert.equal(kondisiBmkg(3, "Berawan").teks, "berawan");
  const om = { suhu: 31, kode: 2, hujan: [30, 45] as [number, number] };
  const both = gabung(b, om)!;
  assert.deepEqual([both.suhu, both.teks, both.hujan, both.mm, both.sumber], [34, "hujan sedang", [30, 45], [8, 22.4], ["BMKG", "Open-Meteo"]]);
  assert.equal(awasHujan(both), true, "22.4 mm tomorrow is a warning");
  const onlyOm = gabung(undefined, om)!;
  assert.deepEqual([onlyOm.suhu, onlyOm.teks, onlyOm.mm, onlyOm.sumber], [31, "berawan", null, ["Open-Meteo"]]);
  assert.equal(awasHujan(onlyOm), false);
  assert.equal(gabung(undefined, undefined), undefined);
  console.log("world.check bmkg ok");
}

// Sunrise/sunset fallback: within 10 minutes of Open-Meteo / almanac times.
{
  const near = (got: number, iso: string) => assert.ok(Math.abs(got - Date.parse(iso)) <= 10 * 60_000, `${new Date(got).toISOString()} vs ${iso}`);
  // Site (Mangkalapi, -3.43, 115.53) on 2026-10-24, asked at 10:00 WITA; Open-Meteo: 05:55:48 and 18:08:13 WITA.
  const site = hitungMatahari(Date.parse("2026-10-24T02:00:00Z"), -3.4337, 115.5287);
  near(site.terbit, "2026-10-23T21:55:48Z");
  near(site.terbenam, "2026-10-24T10:08:13Z");
  // Late evening still lands on the same local day's times, or the next one's: either answers "night" right.
  const late = hitungMatahari(Date.parse("2026-10-24T15:30:00Z"), -3.4337, 115.5287);
  assert.equal(malam(Date.parse("2026-10-24T15:30:00Z"), late), true);
  // London, midsummer 2024: 03:43 and 20:21 UTC.
  const lon = hitungMatahari(Date.parse("2024-06-21T12:00:00Z"), 51.5, -0.12);
  near(lon.terbit, "2024-06-21T03:43:00Z");
  near(lon.terbenam, "2024-06-21T20:21:00Z");

  // Night: before sunrise or from sunset on, folded onto any day.
  const m = { terbit: Date.parse("2026-10-23T21:55:48Z"), terbenam: Date.parse("2026-10-24T10:08:13Z") };
  assert.equal(malam(Date.parse("2026-10-24T02:00:00Z"), m), false, "10:00 WITA");
  assert.equal(malam(Date.parse("2026-10-24T10:30:00Z"), m), true, "18:30 WITA");
  assert.equal(malam(Date.parse("2026-10-23T20:00:00Z"), m), true, "04:00 WITA, before sunrise");
  assert.equal(malam(Date.parse("2026-10-26T03:00:00Z"), m), false, "two days later, a stale cache still reads midday as day");
  assert.equal(malam(Date.parse("2026-10-26T12:00:00Z"), m), true, "two days later, 20:00 WITA");

  assert.deepEqual(bacaMatahari({ daily: { sunrise: [1_761_256_548], sunset: [1_761_300_493] } }), { terbit: 1_761_256_548_000, terbenam: 1_761_300_493_000 });
  assert.equal(bacaMatahari({ daily: { sunrise: ["05:55"], sunset: [1] } }), undefined);
  assert.equal(bacaMatahari(null), undefined);
  console.log("world.check matahari ok");
}
