"use client";

import { useEffect, useState } from "react";
import { nextShift, safetyTalkFor, temaFor, type Site } from "@/lib/site";
import { awasHujan, bacaBmkg, bacaCuaca, gabung, sisaWaktu, type Langit, type Laporan } from "./world";
import "./world.css";

/**
 * Today's K3 message and theme. Before the owner's date is known (first render of a cached page),
 * k3 is "" when one is certain to show, so its strip keeps its place instead of popping in.
 */
export function dunia(site: Site, today: string) {
  const k3 = today ? safetyTalkFor(site.safetyTalk, today) : site.safetyTalk.some((t) => !t.tanggal) ? "" : undefined;
  return { k3, tema: temaFor(site.tema, today) };
}

/** "Ganti shift 18:00 · 1 j 25 m lagi", on the owner's clock (ticks with the page clock). */
export function ShiftCell({ shift, own }: { shift: string[]; own: { hour: number; minute: number } | null }) {
  if (!shift.length) return null;
  const n = own && nextShift(shift, own.hour, own.minute);
  return (
    <div className="hud-cell hud-wide">
      <dt>Shift</dt>
      <dd>{n ? `Ganti shift ${n.at} · ${sisaWaktu(n.minutes)}` : "--:--"}</dd>
    </div>
  );
}

const CACHE_MS = 30 * 60_000;

const getJson = (url: string, signal: AbortSignal) =>
  fetch(url, { signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

/**
 * Site weather, no API keys: BMKG (official, by village code) for condition, temperature and rain in mm,
 * Open-Meteo (by coordinates) for the rain chance. Either one alone is enough; cached per tab for 30 minutes.
 * Fails silently: no cell, no error. `onLaporan` hears each reading (null = none), e.g. for the rain over the HUD.
 */
export function CuacaCell({ cuaca, onLaporan }: { cuaca: Site["cuaca"]; onLaporan?: (l: Laporan | null) => void }) {
  const { aktif, nama, lat, lon, adm4, sumber } = cuaca;
  // undefined = loading, null = failed
  const [c, setC] = useState<Laporan | null>();

  useEffect(() => {
    if (!aktif) return;
    const key = `rambu-cuaca2:${sumber}:${adm4}:${lat},${lon}`;
    try {
      const hit = JSON.parse(sessionStorage.getItem(key) ?? "null");
      if (hit && Date.now() - hit.t < CACHE_MS) return setC(hit.c);
    } catch {}
    const ctl = new AbortController();
    // Debounced: the admin preview re-renders on every keystroke in the coordinates.
    const t = setTimeout(async () => {
      const om =
        sumber !== "bmkg"
          ? getJson(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                "&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FMakassar&forecast_days=2",
              ctl.signal,
            ).then(bacaCuaca)
          : Promise.resolve(undefined);
      const bmkg =
        sumber !== "open-meteo"
          ? getJson(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`, ctl.signal).then((j) => bacaBmkg(j, new Date()))
          : Promise.resolve(undefined);
      const [b, o] = await Promise.allSettled([bmkg, om]);
      if (ctl.signal.aborted) return;
      const v = gabung(b.status === "fulfilled" ? b.value : undefined, o.status === "fulfilled" ? o.value : undefined);
      setC(v ?? null);
      try {
        if (v) sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), c: v }));
      } catch {}
    }, 400);
    return () => (clearTimeout(t), ctl.abort());
  }, [aktif, lat, lon, adm4, sumber]);

  useEffect(() => onLaporan?.(aktif && c ? c : null), [aktif, c, onLaporan]);

  if (!aktif || c === null) return null;
  const awas = !!c && awasHujan(c);
  // Number and unit never split across lines (NBSP).
  const mm = (n: number) => `${String(n).replace(".", ",")}\u00a0mm`;
  const pct = (n: number | undefined) => `${n ?? "--"}%`;
  return (
    <div className="hud-cell hud-wide hud-cuaca" data-waspada={awas || undefined}>
      <dt>
        Cuaca · <bdi>{nama}</bdi>
      </dt>
      {/* Same lines while loading ("--"), so the HUD doesn't grow when the forecast lands. */}
      <dd>
        {c ? <LangitIkon langit={c.langit} /> : <span className="cuaca-ikon" />}
        <span>{c ? `${Math.round(c.suhu)}°C ${c.teks}` : "--°C"}</span>
      </dd>
      {(!c || c.hujan) && (
        <dd className="cuaca-hujan">
          Peluang hujan {pct(c?.hujan?.[0])} · besok {pct(c?.hujan?.[1])}
        </dd>
      )}
      {c?.mm && (
        <dd className="cuaca-hujan">
          Curah hujan {mm(c.mm[0])} · besok {mm(c.mm[1])}
        </dd>
      )}
      {awas && <dd className="cuaca-waspada">Waspada hujan — siaga dewatering</dd>}
      {c && <dd className="cuaca-sumber">Sumber: {c.sumber.join(" · ")}</dd>}
    </div>
  );
}

const CLOUD = "M8 25a6 6 0 0 1 .6-12 8 8 0 0 1 15.2 1.6A5.2 5.2 0 0 1 23 25z";
const RAYS = "M16 2v5M16 25v5M2 16h5M25 16h5M6 6l3.5 3.5M22.5 22.5L26 26M26 6l-3.5 3.5M9.5 22.5L6 26";

/** Weather pictograms drawn like sign symbols: solid shapes, square ends, currentColor. */
function LangitIkon({ langit }: { langit: Langit }) {
  const cut = { stroke: "var(--cuaca-bg)", strokeWidth: 2.5, paintOrder: "stroke" } as const;
  return (
    <svg className="cuaca-ikon" viewBox="0 0 32 32" aria-hidden focusable="false" fill="currentColor" stroke="currentColor" strokeLinecap="square">
      {langit === "cerah" && (
        <>
          <circle cx="16" cy="16" r="6" stroke="none" />
          <path d={RAYS} strokeWidth="3" fill="none" />
        </>
      )}
      {langit === "berawan" && (
        <>
          <g transform="translate(-4 -5) scale(.8)">
            <circle cx="16" cy="16" r="6" stroke="none" />
            <path d={RAYS} strokeWidth="3.5" fill="none" />
          </g>
          <path d={CLOUD} transform="translate(3 3) scale(.9)" {...cut} />
        </>
      )}
      {langit === "mendung" && <path d={CLOUD} stroke="none" />}
      {langit === "kabut" && <path d="M5 10h22M3 16h26M7 22h18" strokeWidth="3.5" fill="none" />}
      {langit === "hujan" && (
        <>
          <path d={CLOUD} transform="translate(0 -6)" stroke="none" />
          <path d="M11 23l-2 5M17 23l-2 5M23 23l-2 5" strokeWidth="3" fill="none" />
        </>
      )}
      {langit === "petir" && (
        <>
          <path d={CLOUD} transform="translate(0 -6)" stroke="none" />
          <path d="M18 17l-6 8h4l-2 6 7-9h-4l2-5z" {...cut} />
        </>
      )}
    </svg>
  );
}

/** Yellow diamond warning strip with today's K3 message; hidden on days without one. */
export function RambuK3({ teks }: { teks?: string }) {
  if (teks === undefined) return null;
  return (
    <section className="k3" aria-label="Rambu K3">
      <svg className="k3-diamond" viewBox="0 0 48 48" aria-hidden focusable="false">
        <path d="M24 1 47 24 24 47 1 24z" fill="var(--black)" />
        <path d="M24 5 43 24 24 43 5 24z" fill="var(--yellow)" />
        <path d="M24 9 39 24 24 39 9 24z" fill="none" stroke="var(--black)" strokeWidth="1.5" />
        <rect x="22" y="14" width="4" height="13" fill="var(--black)" />
        <circle cx="24" cy="31.5" r="2.4" fill="var(--black)" />
      </svg>
      <p>
        <span className="k3-label">Rambu K3 · hari ini</span>
        <span className="k3-teks" dir="auto">
          {teks || "…"}
        </span>
      </p>
    </section>
  );
}
