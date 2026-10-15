"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/auth";
import { saveSite } from "@/lib/store";
import { siteSchema } from "@/lib/site";

export type LoginState = { error?: string };

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD belum diset di server." };
  if (!checkPassword(password)) {
    // ponytail: fixed delay slows guessing; add rate limiting per IP if the page is public-facing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Password salah. Coba lagi." };
  }
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
