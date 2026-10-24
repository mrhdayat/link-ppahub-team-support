import { LABELS, linkSchema, type Link, type Site } from "@/lib/site";

// Admin link tools, pure so url-tools.check.ts can run them: URL cleaning and duplicate keys (#1),
// <title> parsing and the fetch guard's address test (#31), CSV import (#32), bulk edits (#30).

/* ---------- Cleaning (#1) ---------- */

const TRACKING = /^(utm_\w+|fbclid|gclid|dclid|msclkid|si|igsh|igshid)$/i;
// Google's "how was this shared" stamp; pp_url (pre-filled Forms) means something, so it stays.
const USP_NOISE = /^(sharing|share_link|drive_link|drivesdk|send_form)$/i;
const isNoise = (k: string, v: string) => TRACKING.test(k) || (k === "usp" && USP_NOISE.test(v));

/** Query without tracking params, in the original spelling (URLSearchParams would re-encode the rest). */
function stripQuery(search: string): { search: string; dropped: string[] } {
  const dropped: string[] = [];
  const keep = search.replace(/^\?/, "").split("&").filter((p) => {
    if (!p) return false;
    const [k = "", v = ""] = p.split("=");
    if (isNoise(decodeURIComponent(k), v)) return dropped.push(k), false;
    return true;
  });
  return { search: keep.length ? `?${keep.join("&")}` : "", dropped };
}

/**
 * Tidies a pasted URL and says what it changed: spaces, a missing https://, a URL pasted into itself or glued
 * to another one, and tracking params. mailto:/tel: and anything unparseable come back trimmed only.
 */
export function cleanUrl(raw: string): { url: string; changes: string[] } {
  const changes: string[] = [];
  let u = raw.trim().replace(/\s+/g, "");
  if (u !== raw) changes.push("spasi dibuang");
  if (/^(mailto|tel):/i.test(u)) return { url: u, changes };

  // A second http(s):// glued on (not a ?url=https://… or /https://… path, which are real).
  const starts = [...u.matchAll(/https?:\/\//gi)].map((m) => m.index!).filter((i) => i > 0 && !/[=/?&:(%]/.test(u[i - 1]!));
  const at = starts.at(-1);
  if (at !== undefined) {
    const pre = u.slice(0, at);
    const seg = u.slice(at);
    // Pasted into the middle of itself: pre + tail is the same URL as the pasted one.
    const len = (seg.length + pre.length) / 2;
    u = Number.isInteger(len) && pre + seg.slice(len) === seg.slice(0, len) ? seg.slice(0, len) : seg;
    changes.push("URL ganda diperbaiki");
  }

  if (!/^[a-z][a-z0-9+.-]*:/i.test(u) && /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#]|$)/.test(u)) {
    u = `https://${u}`;
    changes.push("https:// ditambahkan");
  }

  let p: URL;
  try {
    p = new URL(u);
  } catch {
    return { url: u, changes };
  }
  if (p.protocol !== "http:" && p.protocol !== "https:") return { url: u, changes };
  const q = u.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)!;
  const { search, dropped } = stripQuery(q[2] ?? "");
  if (dropped.length) {
    u = `${q[1]}${search}${q[3] ?? ""}`;
    changes.push(`pelacak dihapus (${dropped.join(", ")})`);
  }
  return { url: u, changes };
}

/** Google Docs/Sheets/Forms/Slides/Drive file or folder id, from /d/<id>, /d/e/<id>, /folders/<id> or ?id=. */
const googleId = (p: URL) =>
  /(^|\.)google\.com$/.test(p.hostname) && /^(docs|drive)\./.test(p.hostname)
    ? (p.pathname.match(/\/(?:d\/e|d|folders)\/([\w-]{10,})/)?.[1] ?? p.searchParams.get("id") ?? undefined)
    : undefined;

/** What two links must share to open the same thing. */
export function destKey(url: string): string {
  let p: URL;
  try {
    p = new URL(url.trim());
  } catch {
    return url.trim().toLowerCase();
  }
  if (p.protocol !== "http:" && p.protocol !== "https:") return p.href.toLowerCase();
  const gid = p.hash.match(/gid=(\d+)/)?.[1] ?? p.searchParams.get("gid") ?? "";
  const g = googleId(p);
  if (g) return `g:${g}#${gid}`;
  const query = stripQuery(p.search).search.replace(/^\?/, "").split("&").filter(Boolean).sort().join("&");
  return `${p.hostname.replace(/^www\./, "")}${p.pathname.replace(/\/+$/, "")}?${query}`;
}

export const sameDestination = (a: string, b: string) => destKey(a) === destKey(b);

/* ---------- Fetching a title (#31) ---------- */

/**
 * Addresses a server-side fetch must never reach: loopback, private, link-local, CGNAT, multicast, reserved,
 * IPv6 ULA / link-local, and IPv4 wrapped in IPv6. Anything it can't read is refused too.
 */
export function blockedIp(ip: string): boolean {
  const v4 = (s: string) => {
    const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return true;
    const [a, b, c] = [+m[1]!, +m[2]!, +m[3]!];
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0 && c === 0)
      || (a === 198 && (b === 18 || b === 19));
  };
  if (!ip.includes(":")) return v4(ip);
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  // Trailing dotted IPv4 (::ffff:1.2.3.4) → two hex groups.
  s = s.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/, (_, a, b, c, d) =>
    `${((+a << 8) | +b).toString(16)}:${((+c << 8) | +d).toString(16)}`);
  const [head = "", tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const g = (tail === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill("0"), ...t]).map((x) => parseInt(x, 16));
  if (g.length !== 8 || g.some((x) => !(x >= 0 && x <= 0xffff))) return true;
  const embedded = () => v4([g[6]! >> 8, g[6]! & 255, g[7]! >> 8, g[7]! & 255].join("."));
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::, ::1, old IPv4-compatible
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return embedded(); // IPv4-mapped
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return embedded(); // NAT64
  return (g[0]! & 0xfe00) === 0xfc00 || (g[0]! & 0xffc0) === 0xfe80 || (g[0]! & 0xffc0) === 0xfec0 || (g[0]! & 0xff00) === 0xff00;
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const unescape = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" || e[1] === "X" ? 2 : 1), e[1]?.toLowerCase() === "x" ? 16 : 10) || 32)
      : (ENTITY[e.toLowerCase()] ?? m));

const SUFFIX = /\s+[-–—|]\s+(Google (?:Forms|Sheets|Docs|Drive|Slides|Spreadsheets?|Dokumen|Formulir)|Formulir Google|Spreadsheet Google|Dokumen Google)$/i;
const LOGIN = /^(sign[ -]?in|masuk|log[ -]?in)\b|google accounts|akun google|^google \w+: (sign-in|masuk)/i;

export type TitleResult = { ok: true; judul: string; catatan: string } | { ok: false; error: string };

/** og:title (else <title>) from a page, without the site suffix (offered as catatan), cut to the 48 the schema allows. */
export function titleFrom(html: string): TitleResult {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => /(property|name)\s*=\s*["']og:title["']/i.test(t));
  const raw = meta?.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find((x) => x !== undefined)
    ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const t = unescape(raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return { ok: false, error: "Halaman tidak punya judul, isi judul manual" };
  if (LOGIN.test(t)) return { ok: false, error: "Halaman butuh login, isi judul manual" };
  const suffix = t.match(SUFFIX);
  const judul = suffix ? t.slice(0, suffix.index).trim() : t;
  return { ok: true, judul: judul.length > 48 ? `${judul.slice(0, 47).trimEnd()}…` : judul, catatan: suffix?.[1] ?? "" };
}

/* ---------- CSV import (#32) ---------- */

/** RFC 4180: quoted fields may hold commas, quotes ("") and newlines. Blank lines are dropped; a BOM is ignored. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  const end = () => {
    row.push(cell);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
    cell = "";
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') cell += c, i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === ",") row.push(cell), cell = "";
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      end();
    } else cell += c;
  }
  if (cell !== "" || row.length) end();
  return rows;
}

/** A shared Google Sheets link → its CSV export (same tab), else undefined. */
export function sheetCsvUrl(url: string): string | undefined {
  let p: URL;
  try {
    p = new URL(url.trim());
  } catch {
    return undefined;
  }
  const id = p.hostname === "docs.google.com" ? p.pathname.match(/^\/spreadsheets\/d\/([\w-]{10,})/)?.[1] : undefined;
  if (!id || id === "e") return undefined;
  const gid = p.hash.match(/gid=(\d+)/)?.[1] ?? p.searchParams.get("gid") ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

const COLUMNS = {
  judul: ["judul", "title", "nama", "name"],
  url: ["url", "link", "tautan", "alamat"],
  kategori: ["kategori", "category", "jalur"],
  catatan: ["catatan", "note", "notes"],
  kataKunci: ["kata kunci", "katakunci", "keywords", "keyword", "tags"],
  panduan: ["panduan", "guide", "howto", "how to"],
  label: ["label"],
} as const;
type Column = keyof typeof COLUMNS;

export type ImportRow = {
  line: number; // 1-based row in the sheet, header = 1
  link: Link; // kategori may be "" when the sheet's category is unknown
  katRaw: string;
  changes: string[];
  status: "baru" | "duplikat" | "error";
  note: string; // duplicate of / error reason
};

/**
 * Sheet rows → links checked against the site: Baru, Duplikat (same destination as an existing link, archived ones
 * included, or an earlier row) or Error. Categories match by id or name, any case; unknown ones are left "".
 */
export function importRows(table: string[][], site: Site, today: string, newId: () => string): { rows: ImportRow[]; error?: string } {
  const [header, ...body] = table;
  if (!header) return { rows: [], error: "Tabel kosong" };
  const names = header.map((h) => h.trim().toLowerCase().replace(/[_-]+/g, " "));
  const col = Object.fromEntries(
    (Object.keys(COLUMNS) as Column[]).map((c) => [c, names.findIndex((n) => (COLUMNS[c] as readonly string[]).includes(n))]),
  ) as Record<Column, number>;
  if (col.url < 0) return { rows: [], error: "Kolom url/link tidak ditemukan di baris judul" };

  const kat = (v: string) => {
    const x = v.trim().toLowerCase();
    return site.kategori.find((k) => k.id === x || k.nama.toLowerCase() === x)?.id ?? "";
  };
  const seen = new Map(site.link.map((l) => [destKey(l.url), l.arsip ? `${l.judul} (arsip)` : l.judul]));
  const rows = body.map((r, i): ImportRow => {
    const get = (c: Column) => (col[c] >= 0 ? (r[col[c]] ?? "").trim() : "");
    const { url, changes } = cleanUrl(get("url"));
    const label = get("label").toLowerCase();
    const link = {
      id: newId(), judul: get("judul").slice(0, 48) || "", url, kategori: kat(get("kategori")), kategoriLain: [],
      catatan: get("catatan").slice(0, 60), kataKunci: get("kataKunci").slice(0, 120), panduan: get("panduan").slice(0, 280),
      dibuat: today, arsip: false, utama: false,
      label: (LABELS as readonly string[]).includes(label) ? (label as Link["label"]) : undefined,
    } satisfies Link;
    const base = { line: i + 2, link, katRaw: get("kategori"), changes };
    const check = linkSchema.safeParse({ ...link, kategori: link.kategori || "x" });
    if (!check.success) {
      const issue = check.error.issues[0]!;
      return { ...base, status: "error", note: `${String(issue.path[0] ?? "")}: ${issue.message}` };
    }
    const key = destKey(url);
    const dup = seen.get(key);
    if (dup !== undefined) return { ...base, status: "duplikat", note: dup };
    seen.set(key, `baris ${i + 2}`);
    return { ...base, status: "baru", note: "" };
  });
  return { rows };
}

/* ---------- Bulk edits (#30) ---------- */

export type BulkOp =
  | { kind: "kategori"; kategori: string }
  | { kind: "lain"; kategori: string; add: boolean }
  | { kind: "label"; label: Link["label"]; sampai?: string }
  | { kind: "arsip"; arsip: boolean }
  | { kind: "hapus" };

/** One change to every selected link, as a single site update. Archiving also drops utama (the schema refuses both). */
export function bulkEdit(site: Site, ids: ReadonlySet<string>, op: BulkOp): Site {
  if (op.kind === "hapus") return { ...site, link: site.link.filter((l) => !ids.has(l.id)) };
  const order = site.kategori.map((k) => k.id);
  const edit = (l: Link): Link => {
    switch (op.kind) {
      case "kategori":
        return { ...l, kategori: op.kategori, kategoriLain: l.kategoriLain.filter((x) => x !== op.kategori) };
      case "lain": {
        if (op.kategori === l.kategori) return l;
        const lain = op.add ? order.filter((x) => x === op.kategori || l.kategoriLain.includes(x)) : l.kategoriLain.filter((x) => x !== op.kategori);
        return { ...l, kategoriLain: lain };
      }
      case "label":
        return { ...l, label: op.label, labelSampai: op.label ? op.sampai || undefined : undefined };
      case "arsip":
        return { ...l, arsip: op.arsip, utama: op.arsip ? false : l.utama };
    }
  };
  return { ...site, link: site.link.map((l) => (ids.has(l.id) ? edit(l) : l)) };
}

/**
 * Undo for any edit or delete: put `before` (the links as they were, with their old positions) back.
 * Utama comes back only while the gantry has room, so the undo never fails validation.
 */
export function restoreLinks(site: Site, before: { link: Link; at: number }[]): Site {
  const back = new Map(before.map((b) => [b.link.id, b.link]));
  let link = site.link.map((l) => back.get(l.id) ?? l);
  for (const b of [...before].sort((x, y) => x.at - y.at)) {
    if (!link.some((l) => l.id === b.link.id)) link = [...link.slice(0, b.at), b.link, ...link.slice(b.at)];
  }
  let room = 2 - link.filter((l) => l.utama && !back.has(l.id)).length;
  link = link.map((l) => (back.has(l.id) && l.utama ? (room-- > 0 ? l : { ...l, utama: false }) : l));
  return { ...site, link };
}
