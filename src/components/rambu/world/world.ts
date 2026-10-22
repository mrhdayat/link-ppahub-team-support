// Pure helpers for the "dunia rambu" extras (weather, shift, KM post). Self-check: world.check.ts

export type Langit = "cerah" | "berawan" | "mendung" | "kabut" | "hujan" | "petir";
export type Cuaca = { suhu: number; kode: number; hujan: [number, number] };

/** WMO weather code → Indonesian words, the pictogram to draw, and whether it is heavy rain. */
export function kondisi(kode: number): { teks: string; langit: Langit; lebat: boolean } {
  const k = (teks: string, langit: Langit, lebat = false) => ({ teks, langit, lebat });
  if (kode === 0) return k("cerah", "cerah");
  if (kode === 1) return k("cerah berawan", "berawan");
  if (kode === 2) return k("berawan", "berawan");
  if (kode === 3) return k("mendung", "mendung");
  if (kode === 45 || kode === 48) return k("berkabut", "kabut");
  if (kode >= 51 && kode <= 57) return k("gerimis", "hujan");
  if (kode === 61 || kode === 80) return k("hujan ringan", "hujan");
  if (kode === 63 || kode === 81 || kode === 66) return k("hujan sedang", "hujan");
  if (kode === 65 || kode === 82 || kode === 67) return k("hujan lebat", "hujan", true);
  if (kode >= 95) return k("badai petir", "petir", true);
  return k("berawan", "mendung"); // snow codes and anything new: never on site, say something calm
}

/** Rain warning: heavy rain now, or ≥ 60% chance today or tomorrow. */
export const waspada = (c: Cuaca) => kondisi(c.kode).lebat || Math.max(...c.hujan) >= 60;

/** Open-Meteo forecast JSON → the few numbers the HUD shows; undefined when the shape is off. */
export function bacaCuaca(j: unknown): Cuaca | undefined {
  const o = j as { current?: { temperature_2m?: unknown; weather_code?: unknown }; daily?: { precipitation_probability_max?: unknown[] } };
  const suhu = o?.current?.temperature_2m;
  const kode = o?.current?.weather_code;
  const p = o?.daily?.precipitation_probability_max ?? [];
  if (typeof suhu !== "number" || typeof kode !== "number") return undefined;
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return { suhu, kode, hujan: [n(p[0]), n(p[1])] };
}

/** BMKG weather code (+ its own Indonesian text) → words, pictogram, heavy-rain flag. */
export function kondisiBmkg(kode: number, desc = ""): { teks: string; langit: Langit; lebat: boolean } {
  const teks = desc.trim().toLowerCase();
  const k = (fallback: string, langit: Langit, lebat = false) => ({ teks: teks || fallback, langit, lebat });
  if (kode === 0 || kode === 100) return k("cerah", "cerah");
  if (kode === 1 || kode === 2 || kode === 101 || kode === 102) return k("cerah berawan", "berawan");
  if (kode === 3 || kode === 103) return k("berawan", "berawan");
  if (kode === 4 || kode === 104) return k("berawan tebal", "mendung");
  if (kode === 5 || kode === 10 || kode === 45) return k("berkabut", "kabut");
  if (kode === 60 || kode === 80) return k("hujan ringan", "hujan");
  if (kode === 61) return k("hujan sedang", "hujan");
  if (kode === 63) return k("hujan lebat", "hujan", true);
  if (kode === 95 || kode === 97) return k("hujan petir", "petir", true);
  return k("berawan", "mendung");
}

/** BMKG reading: the 3-hour slot covering now, plus rain totals (mm) for today and tomorrow. */
export type Bmkg = { suhu: number; kode: number; teks: string; mm: [number, number] };

/** `now` as "YYYY-MM-DD HH:MM:SS" in an IANA zone (BMKG's local_datetime format). */
export function localStamp(now: Date, zone: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(now).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

const nextDay = (d: string) => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + 1)).toISOString().slice(0, 10);

/** api.bmkg.go.id/publik/prakiraan-cuaca JSON → Bmkg; undefined when the shape is off. */
export function bacaBmkg(j: unknown, now: Date): Bmkg | undefined {
  type Slot = { local_datetime?: unknown; t?: unknown; tp?: unknown; weather?: unknown; weather_desc?: unknown };
  const o = j as { lokasi?: { timezone?: unknown }; data?: { cuaca?: Slot[][] }[] };
  const slots = (o?.data?.[0]?.cuaca ?? []).flat().filter((s): s is Slot & { local_datetime: string; t: number } =>
    typeof s?.local_datetime === "string" && typeof s?.t === "number");
  if (!slots.length) return undefined;
  const zone = typeof o.lokasi?.timezone === "string" ? o.lokasi.timezone : "Asia/Makassar";
  let stamp: string;
  try {
    stamp = localStamp(now, zone);
  } catch {
    stamp = localStamp(now, "Asia/Makassar");
  }
  const cur = [...slots].reverse().find((s) => s.local_datetime <= stamp) ?? slots[0];
  const today = stamp.slice(0, 10);
  const sum = (day: string) =>
    Math.round(slots.filter((s) => s.local_datetime.startsWith(day)).reduce((n, s) => n + (typeof s.tp === "number" ? s.tp : 0), 0) * 10) / 10;
  const kode = typeof cur.weather === "number" ? cur.weather : 3;
  return { suhu: cur.t, kode, teks: kondisiBmkg(kode, typeof cur.weather_desc === "string" ? cur.weather_desc : "").teks, mm: [sum(today), sum(nextDay(today))] };
}

/** What the HUD shows, from whichever sources answered. */
export type Laporan = { suhu: number; teks: string; langit: Langit; lebat: boolean; hujan: [number, number] | null; mm: [number, number] | null; sumber: string[] };

/** BMKG (official) wins for condition and temperature; Open-Meteo adds the rain chance BMKG doesn't publish. */
export function gabung(b?: Bmkg, o?: Cuaca): Laporan | undefined {
  if (!b && !o) return undefined;
  const sumber = [b && "BMKG", o && "Open-Meteo"].filter((x): x is string => !!x);
  const k = b ? kondisiBmkg(b.kode, b.teks) : kondisi(o!.kode);
  return { suhu: b ? b.suhu : o!.suhu, teks: k.teks, langit: k.langit, lebat: k.lebat, hujan: o ? o.hujan : null, mm: b ? b.mm : null, sumber };
}

/** Rain warning: heavy rain now, ≥ 60% chance, or ≥ 20 mm forecast in a day (BMKG "hujan sedang" and up). */
export const awasHujan = (l: Laporan) =>
  l.lebat || (!!l.hujan && Math.max(...l.hujan) >= 60) || (!!l.mm && Math.max(...l.mm) >= 20);

/** "1 j 25 m lagi", "25 m lagi", "2 j lagi". */
export function sisaWaktu(minutes: number): string {
  const j = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${[j && `${j} j`, (m || !j) && `${m} m`].filter(Boolean).join(" ")} lagi`;
}

/** Scrolled pixels → distance on the KM post: 100 px of road is 0,1 km. */
export const kmDari = (px: number) => (Math.max(0, px) / 1000).toFixed(1).replace(".", ",");
