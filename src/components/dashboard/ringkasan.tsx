"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowClockwise, ArrowSquareOut, CopySimple, PencilSimple } from "@phosphor-icons/react";
import type { Counts, Day } from "@/lib/analytics";
import type { Site } from "@/lib/site";
import { Plate, Segmented, copyText, publicUrl } from "./controls";
import {
  addDays, bucket, dayLabel, fmt, fmtCompact, isLinkKey, linkTaps, pct, rangeLabel, span, sum, ticks,
} from "./stats";

type Range = "7" | "30" | "90";
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
  { value: "90", label: "90 hari" },
];

// Chart series: sign blue and sign red on the white panel. Validated with the dataviz palette checker
// (protan ΔE 24, normal ΔE 37, both ≥ 3:1 on the surface). The legend and table carry identity too.
const SERIES = [
  { key: "view", name: "Kunjungan", color: "var(--blue)" },
  { key: "klik", name: "Klik tautan", color: "var(--red)" },
] as const;

export function Ringkasan({
  site, days, today, loading, onRefresh, onEditLink,
}: {
  site: Site; days: Day[]; today: string; loading: boolean;
  onRefresh: () => void; onEditLink: (id: string) => void;
}) {
  const [range, setRange] = useState<Range>("7");
  const n = Number(range);
  const all = useMemo(() => sum(days), [days]);
  const cur = useMemo(() => span(days, today, n), [days, today, n]);
  const prev = useMemo(() => span(days, addDays(today, -n), n), [days, today, n]);
  const c = useMemo(() => sum(cur), [cur]);
  const p = useMemo(() => sum(prev), [prev]);
  const empty = Object.values(all).every((v) => !v);

  const head = (
    <div className="sec-head">
      <h2 className="plate-h" data-warna="yellow">Ringkasan</h2>
      {!empty && (
        <div className="sec-tools">
          <Segmented name="range" label="Rentang waktu" hideLabel value={range} onChange={setRange} options={RANGES} />
          <button type="button" className="icon-btn" aria-label="Muat ulang statistik" onClick={onRefresh}
            disabled={loading} data-busy={loading || undefined}>
            <ArrowClockwise size={20} weight="bold" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );

  if (empty) {
    return (
      <div className="sec">
        {head}
        <section className="panel d-empty">
          <svg viewBox="0 0 120 120" className="empty-sign" aria-hidden focusable="false">
            <rect x="18" y="18" width="84" height="84" rx="9" transform="rotate(45 60 60)" fill="var(--black)" />
            <rect x="24" y="24" width="72" height="72" rx="6" transform="rotate(45 60 60)" fill="var(--yellow)" />
            <path d="M60 36v30M60 78v6" stroke="var(--black)" strokeWidth="9" strokeLinecap="round" />
          </svg>
          <h3>Belum ada kunjungan tercatat</h3>
          <p>Bagikan tautan halamanmu. Angka kunjungan dan klik muncul di sini begitu ada yang membuka halaman.</p>
          <div className="row-actions">
            <button type="button" className="btn btn-primary" onClick={() => copyText(publicUrl(), "Tautan halaman disalin")}>
              <CopySimple size={18} weight="bold" aria-hidden />
              Salin tautan halaman
            </button>
            <a className="btn" href="/" target="_blank" rel="noopener">
              <ArrowSquareOut size={18} weight="bold" aria-hidden />
              Buka halaman
            </a>
            <button type="button" className="btn" onClick={onRefresh} disabled={loading}>
              <ArrowClockwise size={18} weight="bold" aria-hidden />
              {loading ? "Memuat…" : "Muat ulang"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const views = c.view ?? 0;
  const clicks = linkTaps(c);
  const pViews = p.view ?? 0;
  const pClicks = linkTaps(p);
  // Taps per visit, not a percentage: one visit can tap several signs, so a share would pass 100%.
  const ratio = views ? clicks / views : null;
  const pRatio = pViews ? pClicks / pViews : null;
  const vs = `${n} hari sebelumnya`;

  return (
    <div className="sec" data-loading={loading || undefined}>
      {head}
      <ul className="kpis" aria-label={`Angka ${n} hari terakhir`}>
        <Kpi label="Kunjungan" value={fmtCompact(views)} delta={<Delta cur={views} prev={pViews} vs={vs} />} />
        <Kpi label="Klik tautan" value={fmtCompact(clicks)} delta={<Delta cur={clicks} prev={pClicks} vs={vs} />} />
        <Kpi label="Klik per kunjungan" value={ratio === null ? "–" : `${perVisit.format(ratio)}×`} hint="rata-rata tautan diklik tiap kunjungan"
          delta={<Delta cur={ratio} prev={pRatio} vs={vs} points />} />
        <Kpi label="Chat WhatsApp" value={fmtCompact(c.wa ?? 0)} delta={<Delta cur={c.wa ?? 0} prev={p.wa ?? 0} vs={vs} />} />
        <Kpi label="Bagikan + QR" value={fmtCompact((c.share ?? 0) + (c.qr ?? 0))}
          hint={`${fmt(c.share ?? 0)} bagikan · ${fmt(c.qr ?? 0)} QR`}
          delta={<Delta cur={(c.share ?? 0) + (c.qr ?? 0)} prev={(p.share ?? 0) + (p.qr ?? 0)} vs={vs} />} />
      </ul>

      <section className="panel" aria-labelledby="chart-h">
        <div className="panel-head">
          <h3 id="chart-h">Harian</h3>
          <ul className="legend" aria-label="Keterangan">
            <li><span className="key" style={{ background: SERIES[0].color }} aria-hidden />Kunjungan <b>{fmt(views)}</b></li>
            <li><span className="key" style={{ background: SERIES[1].color }} aria-hidden />Klik tautan <b>{fmt(clicks)}</b></li>
          </ul>
        </div>
        <DailyChart days={cur} />
        {!views && !clicks && <p className="field-hint">Tidak ada aktivitas dalam {n} hari terakhir.</p>}
      </section>

      <div className="two-col">
        <TopLinks site={site} cur={c} all={all} n={n} onEditLink={onEditLink} />
        <PerKategori site={site} cur={c} n={n} />
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, delta }: { label: string; value: string; hint?: string; delta: ReactNode }) {
  return (
    <li className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
      {delta}
    </li>
  );
}

/** Change vs the previous equal period: arrow shape + sign + words, never colour alone. */
const perVisit = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

function Delta({ cur, prev, vs, points }: { cur: number | null; prev: number | null; vs: string; points?: boolean }) {
  if (cur === null || prev === null) return <span className="delta" data-dir="flat">Belum bisa dibandingkan</span>;
  const diff = cur - prev;
  const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  let text: string;
  if (dir === "flat") text = `Sama dengan ${vs}`;
  else if (points) text = `${diff > 0 ? "+" : "−"}${perVisit.format(Math.abs(diff))}× dari ${vs}`;
  else if (!prev) text = `+${fmt(diff)} dari 0 (${vs})`;
  else text = `${diff > 0 ? "+" : "−"}${pct(Math.abs(diff / prev) * 100)} dari ${vs}`;
  return (
    <span className="delta" data-dir={dir}>
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden focusable="false">
        {dir === "up" && <path d="M6 1 11 10H1z" fill="currentColor" />}
        {dir === "down" && <path d="M6 11 1 2h10z" fill="currentColor" />}
        {dir === "flat" && <path d="M1 4h10v1.6H1zM1 7h10v1.6H1z" fill="currentColor" />}
      </svg>
      <span className="sr-only">{dir === "up" ? "Naik: " : dir === "down" ? "Turun: " : ""}</span>
      {text}
    </span>
  );
}

/* ---------- Daily chart ---------- */

const H = 220;
const M = { top: 12, right: 8, bottom: 28, left: 40 };
const MIN_BAND = 18;

function colPath(x: number, base: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  const top = base - h;
  return `M${x} ${base}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + w - r}Q${x + w} ${top} ${x + w} ${top + r}V${base}Z`;
}

function DailyChart({ days }: { days: Day[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [kbd, setKbd] = useState(false);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = H - M.top - M.bottom;
  // Bucket days so each column group stays at least MIN_BAND wide (90 days on a phone → weekly).
  const size = [1, 2, 3, 7, 14].find((s) => Math.ceil(days.length / s) * MIN_BAND <= plotW) ?? 14;
  const groups = useMemo(() => bucket(days, size), [days, size]);
  const rows = groups.map((g) => ({ ...g, view: g.counts.view ?? 0, klik: linkTaps(g.counts) }));
  const yt = ticks(Math.max(1, ...rows.map((r) => Math.max(r.view, r.klik))));
  const top = yt[yt.length - 1]!;
  const band = rows.length ? plotW / rows.length : 0;
  const bw = Math.max(2, Math.min(12, (band * 0.72 - 2) / 2));
  const y = (v: number) => (v / top) * plotH;
  const base = M.top + plotH;
  const every = Math.max(1, Math.ceil(56 / Math.max(band, 1)));
  const label = (g: { from: string; to: string }) => (size === 1 ? dayLabel(g.to, true) : rangeLabel(g.from, g.to));

  const at = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left - M.left) / band);
    setKbd(false);
    setActive(i >= 0 && i < rows.length ? i : null);
  };
  const onKey = (e: KeyboardEvent) => {
    const last = rows.length - 1;
    const map: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1), ArrowRight: Math.min(last, (active ?? -1) + 1), Home: 0, End: last,
    };
    if (e.key in map) {
      e.preventDefault();
      setKbd(true);
      setActive(map[e.key]!);
    }
  };
  const a = active !== null ? rows[active] : null;
  const tipLeft = a ? Math.min(Math.max(M.left + band * (active! + 0.5), 80), width - 80) : 0;

  return (
    <div className="chart" ref={box}>
      <div className="chart-plot" tabIndex={0} role="group"
        aria-label={`Grafik ${size === 1 ? "harian" : `per ${size} hari`}. Panah kiri dan kanan membaca nilainya.`}
        onKeyDown={onKey} onFocus={() => active === null && setActive(rows.length - 1)}
        onBlur={() => setActive(null)} onPointerMove={at} onPointerLeave={() => !kbd && setActive(null)}>
        {width > 0 && (
          <svg width={width} height={H} aria-hidden focusable="false">
            {yt.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={width - M.right} y1={base - y(t)} y2={base - y(t)} className="grid" />
                <text x={M.left - 8} y={base - y(t)} className="tick" textAnchor="end" dominantBaseline="middle">
                  {fmtCompact(t)}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const x0 = M.left + band * i;
              const gx = x0 + (band - (bw * 2 + 2)) / 2;
              return (
                <g key={r.to}>
                  {active === i && <rect x={x0} y={M.top} width={band} height={plotH} className="wash" />}
                  <path d={colPath(gx, base, bw, y(r.view))} fill={SERIES[0].color} />
                  <path d={colPath(gx + bw + 2, base, bw, y(r.klik))} fill={SERIES[1].color} />
                  {(rows.length - 1 - i) % every === 0 && (
                    <text x={x0 + band / 2} y={H - 8} className="tick" textAnchor="middle">
                      {size === 1 ? dayLabel(r.to) : dayLabel(r.from)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={M.left} x2={width - M.right} y1={base} y2={base} className="axis" />
          </svg>
        )}
        {a && (
          <div className="tip" style={{ left: tipLeft }} aria-hidden>
            <span className="tip-h">{label(a)}</span>
            {SERIES.map((s) => (
              <span key={s.key} className="tip-row">
                <span className="line-key" style={{ background: s.color }} />
                <b>{fmt(a[s.key])}</b> {s.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {kbd && a ? `${label(a)}: ${fmt(a.view)} kunjungan, ${fmt(a.klik)} klik tautan` : ""}
      </p>
      <table className="sr-only">
        <caption>Kunjungan dan klik tautan per hari</caption>
        <thead><tr><th scope="col">Tanggal</th><th scope="col">Kunjungan</th><th scope="col">Klik tautan</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}><th scope="row">{dayLabel(d.day, true)}</th><td>{d.counts.view ?? 0}</td><td>{linkTaps(d.counts)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Top links ---------- */

const TOP = 10;

function TopLinks({ site, cur, all, n, onEditLink }: {
  site: Site; cur: Counts; all: Counts; n: number; onEditLink: (id: string) => void;
}) {
  const [more, setMore] = useState(false);
  const kat = new Map(site.kategori.map((k) => [k.id, k]));
  const rows = site.link
    .map((l, i) => ({ l, i, now: cur[`l:${l.id}`] ?? 0, ever: all[`l:${l.id}`] ?? 0 }))
    .sort((a, b) => b.now - a.now || b.ever - a.ever || a.i - b.i);
  const clicked = rows.filter((r) => r.ever > 0);
  const never = rows.filter((r) => r.ever === 0);
  const total = clicked.reduce((s, r) => s + r.now, 0);
  const shown = more ? clicked : clicked.slice(0, TOP);

  return (
    <section className="panel" aria-labelledby="top-h">
      <div className="panel-head">
        <h3 id="top-h">Tautan teratas</h3>
        <span className="field-hint">{n} hari terakhir</span>
      </div>
      {clicked.length === 0 ? (
        <p className="field-hint">Belum ada tautan yang diklik.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col" className="num">#</th>
                <th scope="col">Tautan</th>
                <th scope="col" className="num">Klik</th>
                <th scope="col" className="num">Total</th>
                <th scope="col" className="num">Porsi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, rank) => {
                const share = total ? (r.now / total) * 100 : 0;
                const k = kat.get(r.l.kategori);
                return (
                  <tr key={r.l.id}>
                    <td className="num rank">{rank + 1}</td>
                    <td>
                      <span className="cell-title">{r.l.judul}</span>
                      <Plate warna={k?.warna} ikon={k?.ikon} small>{k?.nama ?? "—"}</Plate>
                    </td>
                    <td className="num strong">{fmt(r.now)}</td>
                    <td className="num">{fmt(r.ever)}</td>
                    <td className="num">
                      {pct(share)}
                      <span className="meter" aria-hidden><span style={{ width: `${share}%` }} /></span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {clicked.length > TOP && (
        <button type="button" className="btn btn-quiet" aria-expanded={more} onClick={() => setMore((m) => !m)}>
          {more ? "Tampilkan 10 teratas" : `Tampilkan semua (${clicked.length})`}
        </button>
      )}
      {never.length > 0 && (
        <details className="never">
          <summary>Belum pernah diklik <span className="count-pill">{never.length}</span></summary>
          <p className="field-hint">Tautan yang tidak pernah dipakai bisa diperbarui atau dihapus supaya papan tetap ringkas.</p>
          <ul className="never-list">
            {never.map((r) => (
              <li key={r.l.id}>
                <Plate warna={kat.get(r.l.kategori)?.warna} ikon={kat.get(r.l.kategori)?.ikon} small><span className="sr-only">{kat.get(r.l.kategori)?.nama}</span></Plate>
                <span className="cell-title">{r.l.judul}</span>
                <button type="button" className="icon-btn" aria-label={`Ubah ${r.l.judul}`} onClick={() => onEditLink(r.l.id)}>
                  <PencilSimple size={18} weight="bold" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/* ---------- Per category ---------- */

function PerKategori({ site, cur, n }: { site: Site; cur: Counts; n: number }) {
  const rows = site.kategori
    .map((k) => ({
      k,
      links: site.link.filter((l) => l.kategori === k.id).length,
      klik: site.link.reduce((s, l) => (l.kategori === k.id ? s + (cur[`l:${l.id}`] ?? 0) : s), 0),
    }))
    .sort((a, b) => b.klik - a.klik);
  const max = Math.max(1, ...rows.map((r) => r.klik));
  const orphan = Object.entries(cur).reduce(
    (s, [key, v]) => (isLinkKey(key) && !site.link.some((l) => `l:${l.id}` === key) ? s + v : s), 0);

  return (
    <section className="panel" aria-labelledby="kat-h">
      <div className="panel-head">
        <h3 id="kat-h">Per kategori</h3>
        <span className="field-hint">klik, {n} hari terakhir</span>
      </div>
      <ul className="hbars">
        {rows.map((r) => (
          <li key={r.k.id}>
            <Plate warna={r.k.warna} ikon={r.k.ikon} small>{r.k.nama}</Plate>
            <span className="hbar" aria-hidden><span style={{ width: `${(r.klik / max) * 100}%` }} /></span>
            <span className="hbar-v"><b>{fmt(r.klik)}</b> <span className="field-hint">{r.links} tautan</span></span>
          </li>
        ))}
      </ul>
      {orphan > 0 && <p className="field-hint">{fmt(orphan)} klik berasal dari tautan yang sudah dihapus.</p>}
    </section>
  );
}
