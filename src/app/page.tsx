import type { Metadata, Viewport } from "next";
import { Faceplate } from "@/components/faceplate";
import { getSite } from "@/lib/store";
import { themeVars } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite();
  return {
    title: profile.name,
    description: profile.bio || `Link resmi ${profile.name}`,
    openGraph: { title: profile.name, description: profile.bio || undefined },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSite();
  return { themeColor: themeVars(theme)["--ground"] };
}

export default async function Home() {
  return <Faceplate site={await getSite()} />;
}
