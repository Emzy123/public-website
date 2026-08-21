import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';

// Keep the application self-contained at build time. The editorial serif and mono
// stacks are defined in globals.css; Geist supplies the UI/body fallback locally.
const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sinet.africa'),
  title: {
    default: 'SINet - Pan-African Investment Ecosystem',
    template: '%s | SINet',
  },
  description:
    "SINet connects investors, students, and projects across Africa's most promising sectors. Join the waitlist for Phase 1 launching soon.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SINet - Pan-African Investment Ecosystem',
    description:
      "SINet connects investors, students, and projects across Africa's most promising sectors. Join the waitlist for Phase 1 launching soon.",
    type: 'website',
    url: 'https://sinet.africa',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Build Africa Future' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SINet - Pan-African Investment Ecosystem',
    description:
      "SINet connects investors, students, and projects across Africa's most promising sectors. Join the waitlist for Phase 1 launching soon.",
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
