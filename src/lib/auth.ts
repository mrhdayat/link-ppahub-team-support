import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { ensureSchema, sql } from "./db";

// Single admin. Password from the panel (admin_secret, scrypt) when set, else ADMIN_PASSWORD.
// Session is an HMAC-signed "expiry.version" in an httpOnly cookie; the version is the stored password's,
// so changing the password invalidates every other session.
// Recovery if the panel password is lost: delete the admin_secret row (or data/admin-secret.json) and ADMIN_PASSWORD works again.
const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Signing key: SESSION_SECRET when set; otherwise stretched from the password with scrypt so a
// leaked cookie is not a cheap offline oracle for guessing ADMIN_PASSWORD.
let derived: { from: string; key: Buffer } | null = null;
function secret(): Buffer | string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD belum diset di environment");
  if (derived?.from !== pw) derived = { from: pw, key: scryptSync(pw, "link-teamppa:session:v1", 32) };
  return derived.key;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------- Stored password ---------- */

type Secret = { hash: string; version: number };
const SECRET_FILE = path.join(process.cwd(), "data", "admin-secret.json");
const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

// ponytail: read on every isAdmin (one indexed row), so a change signs out sessions on every instance at once.
async function readSecret(): Promise<Secret | null> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`select hash, version from admin_secret where key = 'admin'`) as Secret[];
    return rows[0] ? { hash: rows[0].hash, version: Number(rows[0].version) } : null;
  }
  try {
    return JSON.parse(await readFile(SECRET_FILE, "utf8"));
  } catch {
    return null;
  }
}

/** "scrypt$<salt b64url>$<hash b64url>" */
async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64url")}$${(await scryptAsync(pw, salt, 32)).toString("base64url")}`;
}

async function verifyHash(pw: string, stored: string): Promise<boolean> {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64url");
  const got = await scryptAsync(pw, Buffer.from(salt, "base64url"), want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Stores a new password and bumps the version. Returns the new version. */
export async function setPassword(pw: string): Promise<number> {
  const hash = await hashPassword(pw);
  if (sql) {
    await ensureSchema();
    const rows = (await sql`insert into admin_secret (key, hash, version) values ('admin', ${hash}, 1)
      on conflict (key) do update set hash = excluded.hash, version = admin_secret.version + 1, updated_at = now()
      returning version`) as { version: number }[];
    return Number(rows[0]!.version);
  }
  const version = ((await readSecret())?.version ?? 0) + 1;
  await mkdir(path.dirname(SECRET_FILE), { recursive: true });
  await writeFile(SECRET_FILE, JSON.stringify({ hash, version }), { mode: 0o600 });
  return version;
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const stored = await readSecret();
  if (stored) return verifyHash(input, stored.hash);
  // Compare fixed-length digests so length differences don't leak through timing.
  const h = (s: string) => createHmac("sha256", "pw-compare").update(s).digest("base64url");
  return safeEqual(h(input), h(expected));
}

// ponytail: in-memory lockout, per server instance. Swap for a shared store (Neon/Redis) if deployed multi-instance.
// The per-IP key trusts forwarded headers, which a client can spoof without a proxy in front.
// So past a global failure count we throttle (1 attempt per 10s for everyone) instead of locking:
// guessing stays capped at ~8.6k/day without letting a stranger lock the admin out entirely.
const failures = new Map<string, { count: number; until: number }>();
const PER_IP = 5;
const GLOBAL = 20;
const LOCK_MS = 15 * 60 * 1000;
const THROTTLE_MS = 10_000;
let lastGlobalAttempt = 0;

/** Seconds the caller must wait before trying, 0 when allowed. */
export function lockedOut(ip: string): number {
  const now = Date.now();
  const f = failures.get(ip);
  if (f && f.count >= PER_IP && f.until > now) return Math.ceil((f.until - now) / 1000);
  const g = failures.get("*");
  if (g && g.count >= GLOBAL && g.until > now) {
    const wait = lastGlobalAttempt + THROTTLE_MS - now;
    if (wait > 0) return Math.ceil(wait / 1000);
    lastGlobalAttempt = now;
  }
  return 0;
}

export function recordFailure(ip: string) {
  for (const key of [ip, "*"]) {
    const f = failures.get(key);
    const fresh = !f || f.until <= Date.now();
    failures.set(key, { count: fresh ? 1 : f.count + 1, until: Date.now() + LOCK_MS });
  }
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}

/** Issues (or re-issues) this browser's session for the current password version. */
export async function startSession() {
  const value = `${Date.now() + MAX_AGE * 1000}.${(await readSecret())?.version ?? 0}`;
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || !process.env.ADMIN_PASSWORD) return false;
  // Pre-version cookies ("exp.mac") fail the shape check: a one-time sign-out after this shipped.
  const [exp, ver, mac] = raw.split(".");
  if (!exp || !ver || !mac || !safeEqual(mac, sign(`${exp}.${ver}`)) || Number(exp) <= Date.now()) return false;
  return Number(ver) === ((await readSecret())?.version ?? 0);
}
