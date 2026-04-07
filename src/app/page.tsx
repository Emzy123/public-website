import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { StatsBar, SinetFlywheel } from '@/components/home/StatsAndFlywheel';
import { EmpirePreviewCards } from '@/components/home/EmpirePreviewCards';
import { InvestorJourneyPreview, TestimonialsSection, HomeCTA } from '@/components/home/HomeExtra';
import { OurImpact } from '@/components/home/OurImpact';
import { WhatWeDo } from '@/components/home/WhatWeDo';

export const metadata: Metadata = {
  title: 'SINet | Youth-Driven Economic Infrastructure Across Africa',
  description:
    'SINet is building a youth-driven economic infrastructure that connects students to capital, production, and ownership across Africa. Active trade cycles, manufacturing, and 5 Mega Empires.',
  openGraph: {
    title: 'SINet | Youth-Driven Economic Infrastructure Across Africa',
    description:
      'Building a structured system that translates student potential into real economic value — through agriculture, trade, manufacturing, and ownership.',
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
            description:
              'Youth-driven economic infrastructure connecting students to capital, production, and ownership across Africa through structured investment cycles.',
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

      {/* 2. Strategic Messaging Line */}
      <div className="bg-[#0A2342]/5 border-y border-[#D4AF37]/15 py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xl md:text-2xl font-bold text-[#0A2342] leading-relaxed">
            &ldquo;SINet is building a youth-driven economic infrastructure that connects
            students to{' '}
            <span className="text-[#D4AF37]">capital, production, and ownership</span>{' '}
            across Africa.&rdquo;
          </p>
        </div>
      </div>

      {/* 3. Our Impact */}
      <OurImpact />

      {/* 4. What We Do */}
      <WhatWeDo />

      {/* 5. Live Stats Bar */}
      <StatsBar />

      {/* 6. SINet Flywheel */}
      <SinetFlywheel />

      {/* 7. 5 Empires Preview */}
      <EmpirePreviewCards />

      {/* 8. Investor Journey 3-step */}
      <InvestorJourneyPreview />

      {/* 9. Testimonials */}
      <TestimonialsSection />

      {/* 10. Final CTA */}
      <HomeCTA />
    </>
  );
}
