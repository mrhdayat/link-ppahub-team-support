import type { Metadata, Viewport } from "next";
import { Faceplate } from "@/components/faceplate";
import { getSite } from "@/lib/store";
import { themeVars, type Theme } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite();
  return {
    title: profile.name,
    description: profile.bio || `Link resmi ${profile.name}`,
    openGraph: { title: profile.name, description: profile.bio || undefined },
  };
}

// The status bar sits over the top of the wall, so it takes the wall's colour (faceplate.css .wall gradient top).
function wallTop(theme: Theme) {
  if (theme.scene === "malam") return "#171f29";
  if (theme.scene === "polos") return themeVars(theme)["--paint-edge"];
  return "#413225";
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSite();
  return { themeColor: wallTop(theme) };
}

export default async function Home() {
  return <Faceplate site={await getSite()} />;
}
