import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import { SITE_URL } from '@/lib/site-config';

const sora = localFont({
  src: './fonts/sora-latin-variable.woff2',
  variable: '--font-heading',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

const inter = localFont({
  src: './fonts/inter-latin-variable.woff2',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SINet — Business Ecosystem & Community',
    template: '%s | SINet',
  },
  description:
    'SINet is a business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SINet — Business Ecosystem & Community',
    description:
      'SINet is a business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
    type: 'website',
    url: SITE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "SINet — Building Africa's Future Systems" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SINet — Business Ecosystem & Community',
    description:
      'SINet is a business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
    images: ['/og-image.png'],
  },
};

import { headers } from 'next/headers';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') || undefined;

  return (
    <html lang="en" className={`scroll-smooth ${sora.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <AnalyticsScripts nonce={nonce} />
        <ServiceWorkerRegister />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
