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

/** "1 j 25 m lagi", "25 m lagi", "2 j lagi". */
export function sisaWaktu(minutes: number): string {
  const j = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${[j && `${j} j`, (m || !j) && `${m} m`].filter(Boolean).join(" ")} lagi`;
}

/** Scrolled pixels → distance on the KM post: 100 px of road is 0,1 km. */
export const kmDari = (px: number) => (Math.max(0, px) / 1000).toFixed(1).replace(".", ",");
