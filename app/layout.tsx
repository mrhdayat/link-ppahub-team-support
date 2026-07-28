import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Support Berjaya — Berjaya di darat, laut dan udara | PT Putra Perkasa Abadi',
  description: 'Portal Resmi Informasi & Layanan Internal Support Berjaya — Berjaya di darat, laut dan udara',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Support Berjaya — Link Hub Portal',
    description: 'Support Berjaya, Berjaya di darat, laut dan udara — PT Putra Perkasa Abadi',
    siteName: 'Support Berjaya Link Hub',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
