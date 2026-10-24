import type { Metadata, Viewport } from "next";
import { Overpass, Overpass_Mono } from "next/font/google";
import "./globals.css";

// Overpass is modeled on US highway signage (Highway Gothic); the mono cut carries HUD data.
const overpass = Overpass({ variable: "--font-sign", subsets: ["latin"], weight: ["600", "800", "900"] });
const overpassMono = Overpass_Mono({ variable: "--font-hud", subsets: ["latin"], weight: ["500", "700"] });

// Manual pick wins; otherwise the site's cached sunrise/sunset (malam() in rambu/world/world.ts); else the OS scheme.
const THEME_INIT = `try{var t=localStorage.getItem("rambu-tema");if(!t){var s=JSON.parse(localStorage.getItem("rambu-matahari"));if(s){var D=864e5;t=((Date.now()-s.terbit)%D+D)%D>=s.terbenam-s.terbit?"dark":"light"}}if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: "TEAM SUPPORT",
  description: "Berjaya di darat, laut dan udara. Semua tautan kerja TEAM SUPPORT dalam satu halaman.",
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
      <body>
        {/* Visitor's day/night choice, applied before first paint (static string, no user data). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
      </body>
    </html>
  );
}
