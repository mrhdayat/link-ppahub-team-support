import { cookies } from "next/headers";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

// Single admin. Password from ADMIN_PASSWORD; session is an HMAC-signed expiry in an httpOnly cookie.
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

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare fixed-length digests so length differences don't leak through timing.
  const h = (s: string) => createHmac("sha256", "pw-compare").update(s).digest("base64url");
  return safeEqual(h(input), h(expected));
}

// ponytail: in-memory lockout per IP, per server instance. Swap for a shared store (Neon/Redis) if deployed multi-instance.
const failures = new Map<string, { count: number; until: number }>();
const LIMIT = 5;
const LOCK_MS = 15 * 60 * 1000;

export function lockedOut(ip: string): number {
  const f = failures.get(ip);
  return f && f.count >= LIMIT && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 60000) : 0;
}

export function recordFailure(ip: string) {
  const f = failures.get(ip);
  const fresh = !f || f.until <= Date.now();
  failures.set(ip, { count: fresh ? 1 : f.count + 1, until: Date.now() + LOCK_MS });
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
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
  const [exp, mac] = raw.split(".");
  return !!exp && !!mac && safeEqual(mac, sign(exp)) && Number(exp) > Date.now();
}
