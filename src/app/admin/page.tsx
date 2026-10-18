import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { readDays } from "@/lib/analytics";
import { clockIn } from "@/lib/site";
import { Dashboard } from "@/components/dashboard/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { isTab } from "@/components/dashboard/tabs";
import "@/components/rambu/tokens.css";
import "@/components/dashboard/dashboard.css";

export const metadata: Metadata = { title: "Panel rambu", robots: { index: false } };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  // isAdmin compares the cookie expiry to Date.now(), so it must run at request time, not in a prerender pass.
  await connection();
  if (!(await isAdmin())) redirect("/admin/login");
  const [site, days, sp] = await Promise.all([getSite(), readDays(), searchParams]);
  const tab = typeof sp.tab === "string" && isTab(sp.tab) ? sp.tab : "ringkasan";
  return <Dashboard initial={site} days={days} today={clockIn(site.status.zona, new Date()).date} initialTab={tab} />;
}
