"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { activeLabel, laneLayout, statusAt, type Kategori, type Link, type Site, type StatusWarna } from "@/lib/site";
import { X } from "@phosphor-icons/react/dist/ssr";
import { Arrow, Diamond, Octagon, SunMoon, UTurn } from "./signs";
import "./tokens.css";
import "./rambu.css";

const THEME_KEY = "rambu-tema";
const VISIT_KEY = "rambu-dilewati";

const norm = (s: string) => s.toLocaleLowerCase("id").normalize("NFD").replace(/[̀-ͯ]/g, "");
const pad = (n: number) => String(n).padStart(2, "0");
const jam = (h: number) => `${pad(h % 24)}.00`;
const isExternal = (u: string) => u.startsWith("https://") || u.startsWith("http://");
const LABEL_TEXT = { baru: "BARU", populer: "POPULER", promo: "PROMO" } as const;
const GROUND = { light: "#e7e3d8", dark: "#1c1c1c" } as const; // --ground, for the browser chrome
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Tape copy repeated until one copy is wider than a desktop screen, so the loop never shows a gap. */
function tapeItems(items: string[]): string[] {
  const chars = items.reduce((n, t) => n + t.length + 6, 0);
  return Array.from({ length: Math.max(1, Math.ceil(200 / chars)) }, () => items).flat();
}

function readSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set();
  }
}

function statusText(s: Site["status"], st: StatusWarna): string {
  if (st === "hijau") return `dibuka sampai ${jam(s.jamTutup)}`;
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

  // Lanes: categories that actually have links, in CONFIG order.
  const lanes = useMemo(
    () => kategori.map((k) => ({ k, links: site.link.filter((l) => l.kategori === k.id) })).filter((lane) => lane.links.length > 0),
    [kategori, site.link],
  );
  const katById = useMemo(() => new Map(kategori.map((k) => [k.id, k])), [kategori]);
  const gantry = useMemo(() => site.link.filter((l) => l.utama && katById.has(l.kategori)).slice(0, 2), [site.link, katById]);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [dark, setDark] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [far, setFar] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Arrival motion plays once; after this flips, re-mounted signs (tab, search, fold) appear instantly.
  const [booted, setBooted] = useState(false);
  const [qr, setQr] = useState("");
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
    setVisited(readSet(VISIT_KEY));
    const t = document.documentElement.dataset.theme;
    const d = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(d);
    if (t) paintChrome(d);
  }, [preview]);

  // #jalur-<id> opens that lane.
  useEffect(() => {
    if (preview) return;
    const fromHash = () => {
      // Only #jalur-<id> (or no hash) picks a lane; other fragments such as the skip link's #cari leave the tab alone.
      if (location.hash && !location.hash.startsWith("#jalur-")) return;
      const id = decodeURIComponent(location.hash.slice("#jalur-".length));
      setTab(lanes.some((l) => l.k.id === id) ? id : null);
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
    if (!preview) history.replaceState(null, "", id ? `#jalur-${id}` : location.pathname + location.search);
  };

  const markVisited = (id: string) => {
    if (preview) return;
    setVisited((v) => {
      const n = new Set(v).add(id);
      try {
        localStorage.setItem(VISIT_KEY, JSON.stringify([...n]));
      } catch {}
      return n;
    });
  };

  // The text stays while the toast fades out; a second flash restarts the timer instead of being cut short.
  const flash = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  }, []);

  const share = async () => {
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

  const showQr = async () => {
    const { toDataURL } = await import("qrcode");
    setQr(await toDataURL(location.href.split("#")[0], { margin: 1, width: 480, errorCorrectionLevel: "M" }));
    dialog.current?.showModal();
  };

  // Filtering.
  const q = norm(query.trim());
  const searching = q.length > 0;
  const matches = (l: Link, k: Kategori) => norm(`${l.judul} ${l.catatan} ${k.nama}`).includes(q);
  const today = now ? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` : "";
  // Until the visitor's date is known, a label with an end date stays hidden rather than flash an expired one.
  const label = (l: Link) => (today ? activeLabel(l, today) : l.labelSampai ? undefined : l.label);

  const shownLanes = lanes
    .filter((lane) => !tab || lane.k.id === tab)
    .map((lane) => ({
      ...lane,
      links: lane.links.filter((l) => (searching ? matches(l, lane.k) : tab ? true : !l.utama)),
    }))
    .filter((lane) => lane.links.length > 0);
  const resultCount = shownLanes.reduce((n, l) => n + l.links.length, 0);
  const showGantry = !searching && !tab && gantry.length > 0;
  const lampu = now ? statusAt(status, now) : null;

  const sign = (l: Link, k: Kategori, i: number, laneNo: number, compact: boolean) => {
    const lb = label(l);
    const ext = isExternal(l.url);
    return (
      <li key={l.id} style={{ "--i": i } as CSSProperties}>
        <a
          className="sign"
          data-warna={k.warna}
          data-compact={compact || undefined}
          href={l.url}
          target={ext ? "_blank" : undefined}
          rel={ext ? "noopener" : undefined}
          onClick={() => markVisited(l.id)}
          onAuxClick={() => markVisited(l.id)}
        >
          <Arrow dir={compact ? "up-right" : "right"} />
          <span className="sign-body">
            <span className="sign-title">
              <bdi>{l.judul}</bdi>
              {lb && (
                <span className="tag" data-label={lb}>
                  {LABEL_TEXT[lb]}
                </span>
              )}
            </span>
            {l.catatan && (
              <span className="sign-note" dir="auto">
                {l.catatan}
              </span>
            )}
          </span>
          {!compact && (
            <span className="sign-km" aria-hidden>
              KM {laneNo}.{i + 1}
            </span>
          )}
          {visited.has(l.id) && <span className="passed">dilewati</span>}
          {ext && <span className="sr-only"> (tab baru)</span>}
        </a>
      </li>
    );
  };

  return (
    <div className="rambu" data-preview={preview || undefined} data-booted={booted || undefined}>
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

      <header className="topbar">
        <div className="tape">
          <div className="tape-run" aria-hidden>
            {[0, 1].map((n) => (
              <span key={n}>
                {tapeItems(site.teksBerjalan.length ? site.teksBerjalan : [profil.nama]).map((t, i) => (
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
              Semua <span className="tab-n">{site.link.length}</span>
            </button>
            {lanes.map(({ k, links }) => (
              <button key={k.id} type="button" className="tab" data-warna={k.warna} aria-pressed={tab === k.id} onClick={() => pickTab(k.id)}>
                {k.nama} <span className="tab-n">{links.length}</span>
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
          <div className="hud-id">
            <Diamond text={profil.inisial} />
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
              <dd>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--"}</dd>
            </div>
            <div className="hud-cell">
              <dt>Rute</dt>
              <dd>{site.link.length} tujuan</dd>
            </div>
          </dl>
        </section>

        {lanes.length > 0 && (
          <div className="search" role="search">
            <label htmlFor="cari" className="sr-only">
              Cari tujuan
            </label>
            <input
              ref={search}
              id="cari"
              type="search"
              placeholder="Cari: toko, video, kelas…"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => (setBooted(true), setQuery(e.target.value))}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
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
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {searching ? `${resultCount} tujuan ditemukan` : ""}
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
                      onClick={() => markVisited(l.id)}
                      onAuxClick={() => markVisited(l.id)}
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
                      {visited.has(l.id) && <span className="passed">dilewati</span>}
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

        {shownLanes.map(({ k, links }) => {
          const laneNo = lanes.findIndex((l) => l.k.id === k.id) + 1;
          const { compact, visible } = laneLayout(links.length);
          const expanded = searching || open.has(k.id);
          const shown = expanded ? links : links.slice(0, visible);
          const hidden = links.length - visible;
          return (
            <section key={k.id} id={`jalur-${k.id}`} className="lane" aria-labelledby={`plate-${k.id}`}>
              <h2 id={`plate-${k.id}`} className="plate" data-warna={k.warna}>
                <span>
                  Jalur <bdi>{k.nama}</bdi>
                </span>{" "}
                <span className="plate-n">{lanes.find((x) => x.k.id === k.id)?.links.length ?? links.length}</span>
              </h2>
              <ul className="signs" data-compact={compact || undefined}>
                {shown.map((l, i) => sign(l, k, i, laneNo, compact))}
              </ul>
              {!searching && hidden > 0 && (
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

        {searching && resultCount === 0 && (
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
            <a className="stop-sign" href={site.whatsapp} target="_blank" rel="noopener" aria-label="Chat WhatsApp (tab baru)">
              <Octagon />
              <span className="stop-text">
                <b>CHAT</b>
                <small>WhatsApp</small>
              </span>
            </a>
            <div className="stop-copy">
              <p className="stop-title">Berhenti sebentar</p>
              <p>Mau kerja sama atau pesan karya? Langsung chat saja.</p>
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
            <button type="button" className="act" onClick={showQr}>
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
              <b>0</b>
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
            <h2 id="qr-title">Pindai untuk mampir</h2>
            <p>Arahkan kamera HP ke kode ini untuk membuka halaman.</p>
            {/* PNG data URL generated by the qrcode package from this page's own URL; no visitor input reaches it. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            {qr && <img className="qr-code" src={qr} alt="Kode QR halaman ini" width={240} height={240} />}
            <button type="button" className="act" data-warna="yellow" onClick={() => dialog.current?.close()}>
              Tutup
            </button>
          </dialog>
          <p className="toast" role="status" data-show={toast.show || undefined}>
            {toast.msg}
          </p>
        </>
      )}
    </div>
  );
}
