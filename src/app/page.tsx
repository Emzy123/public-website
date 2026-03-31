import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { StatsBar, SinetFlywheel } from '@/components/home/StatsAndFlywheel';
import { EmpirePreviewCards } from '@/components/home/EmpirePreviewCards';
import { InvestorJourneyPreview, TestimonialsSection, HomeCTA } from '@/components/home/HomeExtra';

export const metadata: Metadata = {
  title: 'SINet – 15% ROI Every 6 Weeks | Pan-African Investment Ecosystem',
  description:
    'Earn 15% ROI every 6 weeks + 5% capital appreciation through active goods trade. SINet is building 5 Mega Empires across Africa. Start with ₦50,000.',
  openGraph: {
    title: 'SINet – 15% ROI Every 6 Weeks',
    description: 'Active goods trade generating 15% ROI per cycle. Building 5 empires across Africa. Start with ₦50,000.',
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
            description: 'Pan-African Investment Ecosystem. 15% ROI every 6 weeks through active goods trade.',
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
