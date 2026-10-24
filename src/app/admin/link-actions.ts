"use server";

import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { get as httpGet, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import { isAdmin } from "@/lib/auth";
import { blockedIp, sheetCsvUrl, titleFrom, type TitleResult } from "@/components/dashboard/url-tools";

// Admin-only fetches of pages the admin pasted: the title for a new link (#31) and a shared sheet's CSV (#32).
// The server is the one fetching, so every hop is checked against internal addresses (SSRF).

const EXPIRED = "Sesi habis. Masuk lagi.";
const MAX_HOPS = 3;
const LOGIN = "Halaman butuh login, isi judul manual";
const SHARE_STEPS = "Di Google Sheets: Bagikan → Akses umum → Siapa saja yang memiliki link (Pelihat), lalu coba lagi.";

type Got = { ok: true; body: string; full: boolean } | { ok: false; error: string; login?: boolean; type?: boolean; status?: number };

/**
 * GET a public page: http(s) only, no credentials in the URL, at most 3 redirects, 5 s in all, `max` bytes.
 * Each hop's hostname is resolved, every address must be public, and the socket connects to exactly those
 * addresses (no second lookup an attacker's DNS could answer differently).
 */
async function guardedGet(start: string, max: number, type: RegExp): Promise<Got> {
  const signal = AbortSignal.timeout(5000);
  let url = start;
  try {
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Hanya alamat http:// atau https://" };
      if (u.username || u.password) return { ok: false, error: "Alamat tidak boleh berisi nama pengguna atau sandi" };
      // Web ports only: no probing other services on public hosts either.
      if (u.port && u.port !== "80" && u.port !== "443") return { ok: false, error: "Hanya port web standar (80/443)" };
      if (u.hostname === "accounts.google.com") return { ok: false, error: LOGIN, login: true };
      const addrs: LookupAddress[] = await lookup(u.hostname.replace(/^\[|\]$/g, ""), { all: true, verbatim: true });
      if (!addrs.length || addrs.some((a) => blockedIp(a.address))) return { ok: false, error: "Alamat ini menuju jaringan internal" };
      const pinned = ((_h: string, o: { all?: boolean }, cb: (...a: unknown[]) => void) =>
        o?.all ? cb(null, addrs) : cb(null, addrs[0]!.address, addrs[0]!.family)) as never;
      const res = await new Promise<IncomingMessage>((resolve, reject) => {
        const req = (u.protocol === "https:" ? httpsGet : httpGet)(u, {
          signal,
          lookup: pinned,
          headers: { "user-agent": "Mozilla/5.0 (compatible; RambuLinkBot/1.0)", accept: "text/html,text/csv;q=0.9,*/*;q=0.5", "accept-language": "id,en;q=0.8" },
        }, resolve);
        req.on("error", reject);
      });
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        url = new URL(res.headers.location, u).href;
        continue;
      }
      if (status !== 200) {
        res.resume();
        return status === 401 || status === 403
          ? { ok: false, error: LOGIN, login: true }
          : { ok: false, error: `Halaman menjawab ${status}`, status };
      }
      if (!type.test(res.headers["content-type"] ?? "")) {
        res.resume();
        return { ok: false, error: "Alamat ini bukan halaman web", type: true };
      }
      const parts: Buffer[] = [];
      let size = 0;
      for await (const chunk of res as AsyncIterable<Buffer>) {
        parts.push(chunk);
        size += chunk.length;
        if (size > max) break; // leaving the loop closes the socket
      }
      return { ok: true, body: Buffer.concat(parts).subarray(0, max).toString("utf8"), full: size <= max };
    }
    return { ok: false, error: "Terlalu banyak pengalihan" };
  } catch (e) {
    const code = (e as { code?: string; name?: string }).code ?? (e as Error).name;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return { ok: false, error: "Alamat tidak ditemukan" };
    if (code === "AbortError" || code === "TimeoutError" || code === "ABORT_ERR") return { ok: false, error: "Halaman tidak menjawab dalam 5 detik" };
    return { ok: false, error: "Halaman tidak bisa dibuka" };
  }
}

const asUrl = (v: unknown) => (typeof v === "string" && v.length <= 2048 ? v.trim() : "");

/** The page's title for the Judul field; a site suffix like "Google Forms" comes back as the catatan. */
export async function fetchTitle(url: string): Promise<TitleResult> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  const target = asUrl(url);
  if (!target) return { ok: false, error: "Isi alamat dulu" };
  const r = await guardedGet(target, 256 * 1024, /^(text\/html|application\/xhtml\+xml)/i);
  return r.ok ? titleFrom(r.body) : { ok: false, error: r.error };
}

/** A Google Sheets tab as CSV text, through its export link. Only sheets shared with "anyone with the link" work. */
export async function fetchSheetCsv(url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: EXPIRED };
  const csv = sheetCsvUrl(asUrl(url));
  if (!csv) return { ok: false, error: "Bukan link Google Sheets (docs.google.com/spreadsheets/d/…)" };
  const r = await guardedGet(csv, 1_000_000, /^text\/(csv|plain)/i);
  if (!r.ok) return { ok: false, error: r.login || r.type ? `Sheet belum dibagikan publik. ${SHARE_STEPS}`
    : r.status === 404 ? `Sheet tidak ditemukan atau belum dibagikan publik. ${SHARE_STEPS}` : r.error };
  if (!r.full) return { ok: false, error: "Sheet lebih dari 1 MB" };
  return { ok: true, text: r.body };
}
