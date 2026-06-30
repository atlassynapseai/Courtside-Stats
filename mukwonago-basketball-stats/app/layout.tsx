import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import './globals.css'; // Global styles

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mukwonago-basketball-stats.vercel.app';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CourtSide',
    template: '%s | CourtSide',
  },
  description: 'CourtSide is an offline-first youth basketball stats tracker with live scoring, season dashboards, AI recaps, and a broadcast-style game day experience.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'CourtSide',
    description: 'Offline-first youth basketball stats with live scoring, season dashboards, AI recaps, and broadcast-style visuals.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'CourtSide youth basketball stats dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourtSide',
    description: 'Offline-first youth basketball stats with live scoring, season dashboards, AI recaps, and broadcast-style visuals.',
    images: ['/og-image.svg'],
  },
};

export const viewport = {
  themeColor: '#0a0f1e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased bg-brand-navy text-brand-white min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
