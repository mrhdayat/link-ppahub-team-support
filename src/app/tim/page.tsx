import type { Metadata } from "next";
import { TimPage } from "@/components/tim/tim-page";
import { getPublicSite, getSite } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const { profil } = await getSite();
  return {
    title: `Tim · ${profil.nama}`,
    description: `Tim ${profil.nama}: siapa mengurus apa, dan cara menghubunginya.`,
  };
}

export default async function Tim() {
  return <TimPage site={await getPublicSite()} />;
}
