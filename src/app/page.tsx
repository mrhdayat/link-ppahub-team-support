import type { Metadata } from "next";
import { RambuPage } from "@/components/rambu/rambu-page";
import { getSite } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const { profil } = await getSite();
  return {
    title: profil.nama,
    description: profil.bio || `Semua tautan ${profil.nama}`,
    openGraph: { title: profil.nama, description: profil.bio || undefined },
  };
}

export default async function Home() {
  return <RambuPage site={await getSite()} />;
}
