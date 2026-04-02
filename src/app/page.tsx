import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { StatsBar, SinetFlywheel } from '@/components/home/StatsAndFlywheel';
import { EmpirePreviewCards } from '@/components/home/EmpirePreviewCards';
import { InvestorJourneyPreview, TestimonialsSection, HomeCTA } from '@/components/home/HomeExtra';

export const metadata: Metadata = {
  title: 'SINet | Pan-African Investment Ecosystem',
  description:
    'Structured 6-week investment cycle with returns generated through active goods trade and agricultural operations. SINet is building 5 Mega Empires across Africa.',
  openGraph: {
    title: 'SINet | Pan-African Investment Ecosystem',
    description: 'Structured 6-week investment cycle with returns generated through active goods trade and agricultural operations.',
  },
};

export default function Home() {
  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'SINet',
            url: 'https://sinet.africa',
            logo: 'https://sinet.africa/images/logo.jpg',
            description: 'Pan-African Investment Ecosystem. Structured 6-week investment cycle through active goods trade and agricultural operations.',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+2349028239706',
              email: 'sinetworkinggobal@gmail.com',
              contactType: 'customer support',
            },
          }),
        }}
      />

      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Live Stats Bar */}
      <StatsBar />

      {/* 3. SINet Flywheel */}
      <SinetFlywheel />

      {/* 4. 5 Empires Preview */}
      <EmpirePreviewCards />

      {/* 5. Investor Journey 3-step */}
      <InvestorJourneyPreview />

      {/* 6. Testimonials */}
      <TestimonialsSection />

      {/* 7. Final CTA */}
      <HomeCTA />
    </>
  );
}
