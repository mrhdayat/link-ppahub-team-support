import type { Metadata, Viewport } from "next";
import { Archivo, Barlow_Condensed, Big_Shoulders, Doto, Permanent_Marker } from "next/font/google";
import "./globals.css";

// Barlow Condensed is the workshop's label face (default). Doto draws the VFD dot matrix,
// Permanent Marker is the marker on masking tape. Alternates load only when the admin picks them.
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: ["700", "900"] });
const marker = Permanent_Marker({ variable: "--font-marker", subsets: ["latin"], weight: "400" });
const shoulders = Big_Shoulders({ variable: "--font-shoulders", subsets: ["latin"], preload: false });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], preload: false });

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
    <html lang="id" className={`${barlow.variable} ${doto.variable} ${marker.variable} ${shoulders.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
