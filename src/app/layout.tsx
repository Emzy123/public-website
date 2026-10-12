import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import { SITE_URL } from '@/lib/site-config';

// Keep the application self-contained at build time. The editorial serif and mono
// stacks are defined in globals.css; Geist supplies the UI/body fallback locally.
const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-body',
  display: 'swap',
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
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'SINet — Business Ecosystem & Community' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SINet — Business Ecosystem & Community',
    description:
      'SINet is a business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/images/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/images/favicon.svg',
  },
};

import { headers } from 'next/headers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') || undefined;

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geist.variable} antialiased min-h-screen flex flex-col`}>
        <AnalyticsScripts nonce={nonce} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
