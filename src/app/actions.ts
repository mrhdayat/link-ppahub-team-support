"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import {
  checkPassword, clearFailures, endSession, isAdmin, lockedOut, recordFailure, setPassword, startSession,
} from "@/lib/auth";
import { saveSite } from "@/lib/store";
import { siteSchema } from "@/lib/site";

export type LoginState = { error?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

const waitText = (wait: number) =>
  `Terlalu banyak percobaan. Coba lagi dalam ${wait >= 60 ? `${Math.ceil(wait / 60)} menit` : `${wait} detik`}.`;

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD belum diset di server." };
  // The login throttle only caps guessing (~8.6k/day); a long password is what makes that cap safe.
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_PASSWORD.length < 12)
    return { error: "ADMIN_PASSWORD terlalu pendek. Pakai minimal 12 karakter acak di environment server." };
  const ip = await clientIp();
  const wait = lockedOut(ip);
  if (wait) return { error: waitText(wait) };
  if (!(await checkPassword(password))) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Password salah. Coba lagi." };
  }
  clearFailures(ip);
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export type SaveResult = { ok: true; savedAt: number } | { ok: false; error: string; path?: string };

export async function save(input: unknown): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis. Masuk lagi untuk menyimpan." };
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, path: issue.path.join(".") };
  }
  await saveSite(parsed.data);
  updateTag("site");
  return { ok: true, savedAt: Date.now() };
}

export type PasswordResult =
  | { ok: true }
  | { ok: false; error: string; field?: "current" | "next" | "confirm" };

/** Same lockout as login for wrong guesses; on success this browser gets a fresh session, every other one is signed out. */
export async function changePassword(current: string, next: string, confirm: string): Promise<PasswordResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis. Masuk lagi." };
  [current, next, confirm] = [current, next, confirm].map((v) => String(v ?? "").slice(0, 200));
  const ip = await clientIp();
  const wait = lockedOut(ip);
  if (wait) return { ok: false, error: waitText(wait), field: "current" };
  if (!(await checkPassword(current))) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, error: "Password sekarang salah.", field: "current" };
  }
  clearFailures(ip);
  if (next.length < 12) return { ok: false, error: "Minimal 12 karakter.", field: "next" };
  if (next === current) return { ok: false, error: "Harus beda dari password sekarang.", field: "next" };
  if (confirm !== next) return { ok: false, error: "Tidak sama dengan password baru.", field: "confirm" };
  await setPassword(next);
  await startSession();
  return { ok: true };
}
