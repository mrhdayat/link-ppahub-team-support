import { createHash, timingSafeEqual } from "node:crypto";

const MIN = 32;

/** True only for "Bearer <token>" with the configured token (≥32 chars). Hashing first keeps the compare constant-time whatever the lengths. */
export function bearerOk(header: string | null, token: string | undefined): boolean {
  if (!token || token.length < MIN || !header?.startsWith("Bearer ")) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(header.slice(7)), h(token));
}
