import type { Metadata, Viewport } from "next";
import { Overpass, Overpass_Mono } from "next/font/google";
import "./globals.css";

// Overpass is modeled on US highway signage (Highway Gothic); the mono cut carries HUD data.
const overpass = Overpass({ variable: "--font-sign", subsets: ["latin"], weight: ["600", "800", "900"] });
const overpassMono = Overpass_Mono({ variable: "--font-hud", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "Rambu Navigasi",
  description: "Semua tautan dalam satu halaman.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7e3d8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${overpass.variable} ${overpassMono.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
