import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading', display: 'swap' });

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
    icon: '/images/logo-icon.svg',
    apple: '/images/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased min-h-screen flex flex-col`}>
        <AnalyticsScripts />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
