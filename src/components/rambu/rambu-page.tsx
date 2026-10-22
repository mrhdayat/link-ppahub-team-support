"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  ZONA, buka24, clockIn, isOfficeOnly, labelFor, laneLayout, lanesOf, linksIn, statusAt,
  type Kategori, type Link, type Site, type StatusWarna,
} from "@/lib/site";
import { QrCode, X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { Arrow, Hauler, KategoriIkon, Octagon, SunMoon, UTurn } from "./signs";
import { norm, search as searchLinks, type Range } from "./search";
import "./tokens.css";
import "./rambu.css";
// Dunia rambu (W1): weather/shift HUD cells, K3 strip, boom gate, headlight, road markings, seasonal theme.
import { CuacaCell, RambuK3, ShiftCell, dunia } from "./world/hud-extras";
import { Gate, KmJarak, Suasana } from "./world/effects";

const THEME_KEY = "rambu-tema";
const VIEW_KEY = "rambu-dilihat";
const TAMPILAN_KEY = "rambu-tampilan";

/** Fire-and-forget tap counter; survives the page navigating away. */
function hit(k: string) {
  try {
    navigator.sendBeacon?.("/api/hit", new Blob([k], { type: "text/plain" })) ||
      fetch("/api/hit", { method: "POST", body: k, keepalive: true });
  } catch {}
}

const fmt = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

const pad = (n: number) => String(n).padStart(2, "0");
const jam = (h: number) => `${pad(h % 24)}.00`;
const isExternal = (u: string) => u.startsWith("https://") || u.startsWith("http://");
const LABEL_TEXT = { baru: "BARU", populer: "POPULER", promo: "PROMO" } as const;
const GROUND = { light: "#e7e3d8", dark: "#1c1c1c" } as const; // --ground, for the browser chrome
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A 10ms tick on phones that can; never with reduced motion. Callers skip it in the admin preview. */
const buzz = () => !reduced() && navigator.vibrate?.(10);

/** Text with the search's matched parts wrapped in <mark>. */
function Marked({ text, at }: { text: string; at?: Range[] }) {
  if (!at?.length) return text;
  const out: ReactNode[] = [];
  let from = 0;
  at.forEach(([s, e], i) => {
    out.push(text.slice(from, s), <mark key={i}>{text.slice(s, e)}</mark>);
    from = e;
  });
  out.push(text.slice(from));
  return out;
}

/** Easter egg horn: two detuned square waves, quiet, about a third of a second. */
function honk() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
    gain.gain.setValueAtTime(0.04, t + 0.28);
    gain.gain.linearRampToValueAtTime(0, t + 0.34);
    gain.connect(ctx.destination);
    for (const f of [311, 392]) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = f;
      o.connect(gain);
      o.start(t);
      o.stop(t + 0.35);
    }
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

/** Tape copy repeated until one copy is wider than a desktop screen, so the loop never shows a gap. */
function tapeItems(items: string[]): string[] {
  const chars = items.reduce((n, t) => n + t.length + 6, 0);
  return Array.from({ length: Math.max(1, Math.ceil(200 / chars)) }, () => items).flat();
}

function statusText(s: Site["status"], st: StatusWarna): string {
  if (st === "hijau") return s.mode === "otomatis" && buka24(s) ? "dibuka 24 jam" : `dibuka sampai ${jam(s.jamTutup)}`;
  if (st === "kuning") return s.mode === "manual" ? "antrean penuh" : `dibalas mulai ${jam(s.jamBuka)}`;
  return s.mode === "manual" ? "sedang libur" : "libur hari ini";
}

/** Status bar / browser chrome follows the visitor's day/night pick, not only the OS scheme. */
function paintChrome(dark: boolean) {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = dark ? GROUND.dark : GROUND.light));
}

/**
 * Rambu Navigasi public page. `preview` = rendered inside the admin editor:
 * no sticky/fixed chrome, no device storage, no global shortcuts.
 */
export function RambuPage({ site, preview = false }: { site: Site; preview?: boolean }) {
  const { profil, status, kategori } = site;

  // Lanes: categories that actually have links, in CONFIG order. A link sits in every lane of lanesOf().
  const lanes = useMemo(() => kategori.map((k) => ({ k, links: linksIn(site, k.id) })).filter((lane) => lane.links.length > 0), [kategori, site]);
  const katById = useMemo(() => new Map(kategori.map((k) => [k.id, k])), [kategori]);
  const routed = useMemo(() => site.link.filter((l) => katById.has(l.kategori)), [site.link, katById]);
  const gantry = useMemo(() => routed.filter((l) => l.utama).slice(0, 2), [routed]);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string | null>(null);
  const [sorot, setSorot] = useState<string | null>(null); // lane opened from a #jalur- link, highlighted briefly
  const [ringkas, setRingkas] = useState(false);
  const [klakson, setKlakson] = useState(false);
  const klaksonAt = useRef(-Infinity);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [taps, setTaps] = useState<Record<string, number>>({});
  const [dark, setDark] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [far, setFar] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Arrival motion plays once; after this flips, re-mounted signs (tab, search, fold) appear instantly.
  const [booted, setBooted] = useState(false);
  const [qr, setQr] = useState<{ src: string; lane?: Kategori }>({ src: "" });
  const search = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Clock + status lamp tick on the visitor's own time (the page itself is cached).
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 20_000);
    const b = setTimeout(() => setBooted(true), 2500);
    return () => (clearInterval(t), clearTimeout(b));
  }, []);

  // Device-local preferences and history.
  useEffect(() => {
    if (preview) return;
    // one page view per browser session; tap counts for the signs (when the owner shows them)
    try {
      if (!sessionStorage.getItem(VIEW_KEY)) {
        sessionStorage.setItem(VIEW_KEY, "1");
        hit("view");
      }
    } catch {}
    if (site.tampilKlik)
      fetch("/api/hits")
        .then((r) => (r.ok ? r.json() : {}))
        .then(setTaps)
        .catch(() => {});
    const t = document.documentElement.dataset.theme;
    const d = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(d);
    if (t) paintChrome(d);
    try {
      setRingkas(localStorage.getItem(TAMPILAN_KEY) === "ringkas");
    } catch {}
  }, [preview, site.tampilKlik]);

  // #jalur-<id> (a shared link or a lane QR) opens that lane and points it out.
  useEffect(() => {
    if (preview) return;
    const fromHash = () => {
      // Only #jalur-<id> (or no hash) picks a lane; other fragments such as the skip link's #cari leave the tab alone.
      if (location.hash && !location.hash.startsWith("#jalur-")) return;
      const id = decodeURIComponent(location.hash.slice("#jalur-".length));
      const known = lanes.some((l) => l.k.id === id);
      setTab(known ? id : null);
      setSorot(known ? id : null);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, [lanes, preview]);

  // "/" focuses search; U-turn shows after 700px.
  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !dialog.current?.open &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) &&
        !t.isContentEditable
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    const onScroll = () => setFar(scrollY > 700);
    addEventListener("keydown", onKey);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("scroll", onScroll);
    };
  }, [preview]);

  // A picked lane (tab or #jalur- link) is brought under the header if the page was scrolled past it,
  // and its tab is scrolled into the strip. Instant: this follows a click or a keypress.
  useEffect(() => {
    if (preview) return;
    const strip = tabsRef.current;
    const btn = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (strip && btn) strip.scrollTo({ left: btn.offsetLeft - strip.offsetLeft - 16 });
    const lane = tab && document.getElementById(`jalur-${tab}`);
    const header = document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;
    if (lane && lane.getBoundingClientRect().top < header) lane.scrollIntoView({ block: "start" });
  }, [tab, preview]);

  // Arriving on #jalur-<id>: the lane is brought under the header and its plate flashes for a moment.
  useEffect(() => {
    if (!sorot) return;
    document.getElementById(`jalur-${sorot}`)?.scrollIntoView({ block: "start" });
    const t = setTimeout(() => setSorot(null), 1600);
    return () => clearTimeout(t);
  }, [sorot]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    paintChrome(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };

  const pickTab = (id: string | null) => {
    setBooted(true);
    setTab(id);
    if (preview) return;
    if (id !== tab) buzz();
    history.replaceState(null, "", id ? `#jalur-${id}` : location.pathname + location.search);
  };

  // Count the tap, and bump the visible number right away so the visitor sees their own tap land.
  const tapped = (id: string) => {
    if (preview) return;
    buzz();
    hit(`l:${id}`);
    setTaps((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }));
  };

  const pickTampilan = (r: boolean) => {
    setBooted(true);
    setRingkas(r);
    if (preview) return;
    try {
      localStorage.setItem(TAMPILAN_KEY, r ? "ringkas" : "kartu");
    } catch {}
  };

  const onQuery = (v: string) => {
    setBooted(true);
    setQuery(v);
    // "klakson": a hauler drives past with a horn. Once per 10s; never in the preview or with reduced motion.
    if (preview || norm(v.trim()) !== "klakson" || reduced() || performance.now() - klaksonAt.current < 10_000) return;
    klaksonAt.current = performance.now();
    setKlakson(true);
    honk();
  };

  // The text stays while the toast fades out; a second flash restarts the timer instead of being cut short.
  const flash = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }, []);

  const share = async () => {
    if (!preview) hit("share");
    const url = location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: profil.nama, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // the visitor closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flash("Tautan halaman disalin");
    } catch {
      flash("Salin manual: " + url);
    }
  };

  // The page QR, or one lane's (its URL opens straight onto that lane).
  const showQr = async (lane?: Kategori) => {
    if (!preview) hit("qr");
    const { toDataURL } = await import("qrcode");
    const url = location.href.split("#")[0] + (lane ? `#jalur-${encodeURIComponent(lane.id)}` : "");
    setQr({ src: await toDataURL(url, { margin: 1, width: 480, errorCorrectionLevel: "M" }), lane });
    dialog.current?.showModal();
  };

  // Filtering.
  const searching = norm(query.trim()).length > 0;
  const laneName = useCallback((id: string) => katById.get(id)?.nama, [katById]);
  // One ranked list, each link once; a picked tab narrows it to that lane.
  const hits = useMemo(
    () => (searching ? searchLinks(tab ? routed.filter((l) => lanesOf(l).includes(tab)) : routed, laneName, query) : []),
    [searching, routed, tab, laneName, query],
  );
  // The owner's clock: opening hours, label dates and the HUD time all read in their zone.
  const own = now ? clockIn(status.zona, now) : null;
  const today = own?.date ?? "";
  // Until the visitor's date is known, a label with an end date stays hidden rather than flash an expired one.
  const label = (l: Link) => (today ? labelFor(l, today) : l.labelSampai ? undefined : l.label);

  const shownLanes = searching
    ? []
    : lanes
        .filter((lane) => !tab || lane.k.id === tab)
        .map((lane) => ({ ...lane, links: tab ? lane.links : lane.links.filter((l) => !l.utama) }))
        .filter((lane) => lane.links.length > 0);
  const showGantry = !searching && !tab && gantry.length > 0;
  const lampu = now ? statusAt(status, now) : null;
  const laneNo = (id: string) => lanes.findIndex((l) => l.k.id === id) + 1;
  // Dunia rambu: today's K3 message (tape + strip) and the seasonal theme.
  const { k3, tema } = dunia(site, today);

  // ↓/↑ walk the search box and the results; Esc from anywhere in them clears the search.
  const roam = (e: ReactKeyboardEvent) => {
    if (!searching || (e.target as HTMLElement).closest(".panduan")) return; // a guide popover handles its own keys
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      search.current?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const stops = [search.current, ...document.querySelectorAll<HTMLElement>(".hasil .sign")].filter((x) => !!x);
    const i = stops.indexOf(document.activeElement as HTMLElement);
    const next = stops[Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), stops.length - 1)];
    if (i < 0 || next === stops[i]) return;
    e.preventDefault();
    next.focus();
    next.scrollIntoView({ block: "nearest" });
  };

  /** One sign. `k` is the lane it stands in (its colour); the link's other lanes show as "juga di". */
  const sign = (l: Link, k: Kategori, i: number, km: string, compact: boolean, at?: { judul: Range[]; catatan: Range[] }) => {
    const lb = label(l);
    const ext = isExternal(l.url);
    const office = isOfficeOnly(l.url);
    const also = lanesOf(l).filter((id) => id !== k.id).flatMap((id) => katById.get(id) ?? []);
    const tip = `panduan-${k.id}-${l.id}`;
    return (
      <li key={l.id} style={{ "--i": i } as CSSProperties} data-info={l.panduan ? "" : undefined}>
        <a
          className="sign"
          data-warna={k.warna}
          data-compact={compact || undefined}
          href={l.url}
          target={ext ? "_blank" : undefined}
          rel={ext ? "noopener" : undefined}
          onClick={() => tapped(l.id)}
          onAuxClick={() => tapped(l.id)}
        >
          <Arrow dir={compact ? "up-right" : "right"} />
          <span className="sign-body">
            <span className="sign-title">
              <bdi>
                <Marked text={l.judul} at={at?.judul} />
              </bdi>
              {lb && (
                <span className="tag" data-label={lb}>
                  {LABEL_TEXT[lb]}
                </span>
              )}
              {office && (
                <span className="tag" data-label="kantor" aria-hidden>
                  Jaringan kantor
                </span>
              )}
            </span>
            {l.catatan && (
              <span className="sign-note" dir="auto">
                <Marked text={l.catatan} at={at?.catatan} />
              </span>
            )}
            {also.length > 0 && (
              <span className="juga">
                juga di{" "}
                {also.map((x) => (
                  <span key={x.id} className="mini-plate" data-warna={x.warna}>
                    {x.nama}
                  </span>
                ))}
              </span>
            )}
          </span>
          {!compact && (
            <span className="sign-km" aria-hidden>
              KM {km}
            </span>
          )}
          {site.tampilKlik && taps[l.id] > 0 && <span className="taps">{fmt.format(taps[l.id])}× klik</span>}
          {office && <span className="sr-only"> (hanya bisa dibuka dari jaringan kantor)</span>}
          {ext && <span className="sr-only"> (tab baru)</span>}
        </a>
        {l.panduan && (
          <>
            <button type="button" className="info" popoverTarget={tip} aria-label={`Panduan ${l.judul}`}>
              i
            </button>
            <div id={tip} popover="auto" className="panduan" role="dialog" aria-label={`Panduan ${l.judul}`}>
              <p className="panduan-title" dir="auto">
                {l.judul}
              </p>
              <p dir="auto">{l.panduan}</p>
              <button type="button" className="act" data-warna="yellow" popoverTarget={tip} popoverTargetAction="hide">
                Tutup
              </button>
            </div>
          </>
        )}
      </li>
    );
  };

  return (
    <div className="rambu" data-preview={preview || undefined} data-booted={booted || undefined} data-tema={tema}>
      {!preview && lanes.length > 0 && (
        <a
          className="skip"
          href="#cari"
          onClick={(e) => {
            e.preventDefault();
            search.current?.focus();
          }}
        >
          Lompat ke pencarian
        </a>
      )}

      {/* Dunia rambu: road-edge markings + night headlight */}
      {!preview && <Suasana />}

      <header className="topbar">
        <div className="tape">
          <div className="tape-run" aria-hidden>
            {[0, 1].map((n) => (
              <span key={n}>
                {tapeItems([...(k3 ? [`K3 · ${k3}`] : []), ...(site.teksBerjalan.length ? site.teksBerjalan : [profil.nama])]).map((t, i) => (
                  <span key={i} className="tape-item" dir="auto">
                    {t}
                  </span>
                ))}
              </span>
            ))}
          </div>
          <span className="sr-only">{site.teksBerjalan.join(". ")}</span>
          <button type="button" className="mode" onClick={toggleTheme} aria-pressed={dark} aria-label="Mode malam">
            <SunMoon dark={dark} />
          </button>
        </div>
        {lanes.length > 0 && (
          <nav ref={tabsRef} className="tabs" aria-label="Jalur">
            <button type="button" className="tab" aria-pressed={!tab} onClick={() => pickTab(null)}>
              Semua <span className="tab-n">{routed.length}</span>
            </button>
            {lanes.map(({ k, links }) => (
              <button key={k.id} type="button" className="tab" data-warna={k.warna} aria-pressed={tab === k.id} onClick={() => pickTab(k.id)}>
                <KategoriIkon ikon={k.ikon} /> {k.nama} <span className="tab-n">{links.length}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="road">
        <section className="hud" aria-label="Profil">
          <span className="bracket" data-c="tl" aria-hidden />
          <span className="bracket" data-c="tr" aria-hidden />
          <span className="bracket" data-c="bl" aria-hidden />
          <span className="bracket" data-c="br" aria-hidden />
          <span className="scan" aria-hidden />
          {!preview && <Gate />}
          <div className="hud-id">
            <span className="logo-sign">
              <Image src="/logo-ppa.png" alt="Logo PPA" width={96} height={96} priority />
            </span>
            <div>
              <h1 ref={nameRef} className="hud-name" tabIndex={-1} dir="auto">
                {profil.nama}
              </h1>
              {profil.bio && (
                <p className="hud-bio" dir="auto">
                  {profil.bio}
                </p>
              )}
            </div>
          </div>
          <dl className="hud-data">
            <div className="hud-cell hud-status">
              <dt>Status</dt>
              <dd>
                <span className="lights" aria-hidden>
                  {(["merah", "kuning", "hijau"] as const).map((c) => (
                    <i key={c} data-c={c} data-on={lampu === c || undefined} />
                  ))}
                </span>
                {lampu ? statusText(status, lampu) : "memeriksa…"}
              </dd>
            </div>
            <div className="hud-cell">
              <dt>Jam</dt>
              <dd>{own ? `${pad(own.hour)}:${pad(own.minute)} ${ZONA[status.zona]}` : "--:--"}</dd>
            </div>
            <div className="hud-cell">
              <dt>Rute</dt>
              <dd>{site.link.length} tujuan</dd>
            </div>
            {/* Dunia rambu: next shift change + site weather */}
            <ShiftCell shift={site.shift} own={own} />
            <CuacaCell cuaca={site.cuaca} />
          </dl>
        </section>
        <RambuK3 teks={k3} />

        {lanes.length > 0 && (
          <div className="finder">
            <div className="search" role="search">
              <label htmlFor="cari" className="sr-only">
                Cari tujuan
              </label>
              <input
                ref={search}
                id="cari"
                type="search"
                placeholder="Cari: CCO, permit, monitoring…"
                autoComplete="off"
                enterKeyHint="search"
                aria-describedby="cari-hint"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                onKeyDown={(e) => (searching ? roam(e) : e.key === "Escape" && setQuery(""))}
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => (setQuery(""), search.current?.focus())} aria-label="Hapus pencarian">
                  <X weight="bold" aria-hidden />
                </button>
              )}
              {!preview && (
                <kbd className="search-key" aria-hidden>
                  /
                </kbd>
              )}
              <span id="cari-hint" className="sr-only">
                Panah bawah untuk menelusuri hasil, Esc untuk menghapus.
              </span>
            </div>
            <div className="tampilan" role="group" aria-label="Tampilan">
              <button type="button" aria-pressed={!ringkas} onClick={() => pickTampilan(false)}>
                Kartu
              </button>
              <button type="button" aria-pressed={ringkas} onClick={() => pickTampilan(true)}>
                Ringkas
              </button>
            </div>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {searching ? `${hits.length} tujuan ditemukan` : ""}
        </p>

        {showGantry && (
          <section className="gantry" aria-label="Tujuan utama">
            <div className="gantry-beam" aria-hidden />
            <ul className="gantry-boards" data-n={gantry.length}>
              {gantry.map((l) => {
                const ext = isExternal(l.url);
                return (
                  <li key={l.id}>
                    <a
                      className="board"
                      href={l.url}
                      target={ext ? "_blank" : undefined}
                      rel={ext ? "noopener" : undefined}
                      onClick={() => tapped(l.id)}
                      onAuxClick={() => tapped(l.id)}
                    >
                      <span className="board-title" dir="auto">
                        {l.judul}
                      </span>
                      {l.catatan && (
                        <span className="board-note" dir="auto">
                          {l.catatan}
                        </span>
                      )}
                      <Arrow dir="down" />
                      {site.tampilKlik && taps[l.id] > 0 && <span className="taps">{fmt.format(taps[l.id])}× klik</span>}
                      {ext && <span className="sr-only"> (tab baru)</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
            <span className="post" data-side="l" aria-hidden />
            <span className="post" data-side="r" aria-hidden />
          </section>
        )}

        {searching && hits.length > 0 && (
          <section className="lane hasil" aria-labelledby="plate-hasil" onKeyDown={roam}>
            <h2 id="plate-hasil" className="plate" data-warna="yellow">
              <span>Hasil pencarian</span> <span className="plate-n">{hits.length}</span>
            </h2>
            <ul className="signs" data-compact={(!ringkas && laneLayout(hits.length).compact) || undefined} data-ringkas={ringkas || undefined}>
              {hits.map((h, i) => {
                const k = katById.get(h.link.kategori)!;
                const lane = lanes.find((x) => x.k.id === k.id)?.links ?? [];
                const km = `${laneNo(k.id)}.${lane.indexOf(h.link) + 1}`;
                return sign(h.link, k, i, km, !ringkas && laneLayout(hits.length).compact, h);
              })}
            </ul>
          </section>
        )}

        {shownLanes.map(({ k, links }) => {
          const no = laneNo(k.id);
          const layout = laneLayout(links.length);
          // Ringkas: one line per sign, every sign shown, no fold.
          const compact = !ringkas && layout.compact;
          const visible = ringkas ? links.length : layout.visible;
          const expanded = open.has(k.id);
          const shown = expanded ? links : links.slice(0, visible);
          const hidden = links.length - visible;
          return (
            <section key={k.id} id={`jalur-${k.id}`} className="lane" aria-labelledby={`plate-${k.id}`} data-sorot={sorot === k.id || undefined}>
              <div className="lane-head">
                <h2 id={`plate-${k.id}`} className="plate" data-warna={k.warna}>
                  <KategoriIkon ikon={k.ikon} />
                  <span>
                    Jalur <bdi>{k.nama}</bdi>
                  </span>{" "}
                  <span className="plate-n">{lanes.find((x) => x.k.id === k.id)?.links.length ?? links.length}</span>
                </h2>
                {!preview && (
                  <button type="button" className="plate-qr" onClick={() => showQr(k)} aria-label={`Kode QR jalur ${k.nama}`}>
                    <QrCode weight="bold" aria-hidden />
                  </button>
                )}
              </div>
              <ul className="signs" data-compact={compact || undefined} data-ringkas={ringkas || undefined}>
                {shown.map((l, i) => sign(l, k, i, `${no}.${i + 1}`, compact))}
              </ul>
              {hidden > 0 && (
                <button
                  type="button"
                  className="fold"
                  aria-expanded={expanded}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    setBooted(true);
                    setOpen((o) => {
                      const n = new Set(o);
                      if (n.has(k.id)) n.delete(k.id);
                      else n.add(k.id);
                      return n;
                    });
                    // Opening: focus lands on the first revealed sign, so Tab continues there. Closing: keep the button on screen.
                    requestAnimationFrame(() => {
                      const first = document.querySelector<HTMLElement>(`#jalur-${k.id} .signs > li:nth-child(${visible + 1}) a`);
                      if (!expanded && first) first.focus();
                      else btn.scrollIntoView({ block: "nearest" });
                    });
                  }}
                >
                  {expanded ? "Ringkas jalur ini" : `Tampilkan ${hidden} tujuan lainnya`}
                </button>
              )}
            </section>
          );
        })}

        {searching && hits.length === 0 && (
          <p className="empty">
            Tujuan tidak ditemukan. Coba kata lain, atau{" "}
            <button type="button" className="link-btn" onClick={() => (setQuery(""), pickTab(null))}>
              lihat semua jalur
            </button>
            .
          </p>
        )}

        {site.whatsapp && (
          <section className="stop" aria-label="Chat">
            <a className="stop-sign" href={site.whatsapp} target="_blank" rel="noopener" onClick={() => !preview && hit("wa")} aria-label="Chat WhatsApp (tab baru)">
              <Octagon />
              <span className="stop-text">
                <b>CHAT</b>
                <small>WhatsApp</small>
              </span>
            </a>
            <div className="stop-copy">
              <p className="stop-title">Berhenti sebentar</p>
              <p>Butuh bantuan tim support? Langsung chat saja.</p>
              <div className="limit">
                <span className="limit-sign" aria-hidden>
                  {site.balasMaksJam}
                </span>
                <span>
                  Batas waktu balas pesan paling lama <b>{site.balasMaksJam} jam</b>
                </span>
              </div>
            </div>
          </section>
        )}

        {!preview && (
          <div className="actions">
            <button type="button" className="act" data-warna="yellow" onClick={share}>
              Bagikan
            </button>
            <button type="button" className="act" onClick={() => showQr()}>
              Kode QR
            </button>
          </div>
        )}

        <footer className="km">
          <div className="marking" aria-hidden />
          <div className="km-post" aria-hidden>
            <span className="km-cap" />
            <span className="km-face">
              KM
              <KmJarak preview={preview} />
            </span>
          </div>
          <p>Titik awal semua rute.</p>
        </footer>
      </main>

      {!preview && (
        <>
          <button
            type="button"
            className="uturn"
            data-show={far || undefined}
            aria-label="Putar balik ke atas"
            onClick={(e) => {
              // Keyboard (detail 0) or reduced motion: jump, and hand focus to the top of the page.
              const kbd = e.detail === 0;
              scrollTo({ top: 0, behavior: kbd || reduced() ? "instant" : "smooth" });
              if (kbd) nameRef.current?.focus({ preventScroll: true });
            }}
          >
            <UTurn />
          </button>
          <dialog
            ref={dialog}
            className="qr"
            aria-labelledby="qr-title"
            onClick={(e) => {
              // Backdrop clicks land on the <dialog> itself but outside its box; padding clicks are inside it.
              const r = e.currentTarget.getBoundingClientRect();
              const out = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
              if (e.target === e.currentTarget && out) e.currentTarget.close();
            }}
          >
            <h2 id="qr-title">{qr.lane ? <>Jalur <bdi>{qr.lane.nama}</bdi></> : "Pindai untuk mampir"}</h2>
            <p>{qr.lane ? "Pindai untuk langsung membuka jalur ini." : "Arahkan kamera HP ke kode ini untuk membuka halaman."}</p>
            {/* PNG data URL generated by the qrcode package from this page's own URL; no visitor input reaches it. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            {qr.src && <img className="qr-code" src={qr.src} alt={qr.lane ? `Kode QR jalur ${qr.lane.nama}` : "Kode QR halaman ini"} width={240} height={240} />}
            <div className="qr-actions">
              <a className="act" href={qr.src || undefined} download={`qr-${qr.lane ? `jalur-${qr.lane.id}` : "halaman"}.png`}>
                Unduh PNG
              </a>
              <button type="button" className="act" data-warna="yellow" onClick={() => dialog.current?.close()}>
                Tutup
              </button>
            </div>
          </dialog>
          {klakson && (
            <div className="klakson" aria-hidden onAnimationEnd={() => setKlakson(false)}>
              <Hauler />
            </div>
          )}
          <p className="toast" role="status" data-show={toast.show || undefined}>
            {toast.msg}
          </p>
        </>
      )}
    </div>
  );
}
