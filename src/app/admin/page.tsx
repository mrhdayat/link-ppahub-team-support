import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { Editor } from "@/components/editor/editor";
import { PANEL } from "@/components/editor/panel";
import "@/components/editor/editor.css";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="ed-loading" style={PANEL}>Memuat editor…</p>}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  // isAdmin compares the cookie expiry to Date.now(), so it must run at request time, not in a prerender pass.
  await connection();
  if (!(await isAdmin())) redirect("/admin/login");
  return <Editor initial={await getSite()} />;
}
