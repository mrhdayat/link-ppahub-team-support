import type { Metadata, Viewport } from "next";
import { Archivo, Barlow, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// Archivo is the default face; the others load only when the admin picks them.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "600", "700"], preload: false });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Links",
  description: "Semua link penting dalam satu halaman.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${archivo.variable} ${barlow.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
