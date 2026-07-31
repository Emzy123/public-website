import { HeroCarousel } from '@/components/home/HeroCarousel';
import { StatsBar, SinetFlywheel } from '@/components/home/StatsAndFlywheel';
import { EmpirePreviewCards } from '@/components/home/EmpirePreviewCards';
import { InvestorJourneyPreview, TestimonialsSection, HomeCTA } from '@/components/home/HomeExtra';
import { OurImpact } from '@/components/home/OurImpact';
import { WhatWeDo } from '@/components/home/WhatWeDo';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('home', {
    title: 'SINet | Youth-Driven Economic Infrastructure Across Africa',
    description:
      'SINet is building a youth-driven economic infrastructure that connects students to capital, production, and ownership across Africa. Active trade cycles, manufacturing, and 5 Mega Empires.',
  });
}

export default async function Home() {
  const [heroSlides, home, settings] = await Promise.all([
    getCmsContent('hero-slides'),
    getCmsContent('home'),
    getCmsContent('site-settings'),
  ]);

  const quoteParts = home.strategicQuote.split('capital, production, and ownership');
  const quoteHighlight = quoteParts.length > 1 ? 'capital, production, and ownership' : '';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'SINet',
            url: 'https://sinet.africa',
            logo: settings.logoUrl ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `https://sinet.africa${settings.logoUrl}`) : 'https://sinet.africa/images/logo.jpg',
            description: settings.seo.defaultDescription,
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: settings.contact.whatsappDisplay,
              email: settings.contact.email,
              contactType: 'customer support',
            },
          }),
        }}
      />

      <HeroCarousel slides={heroSlides} />

      <div className="bg-[#0A2342]/5 border-y border-[#D4AF37]/15 py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xl md:text-2xl font-bold text-[#0A2342] leading-relaxed">
            &ldquo;{quoteParts[0]}
            {quoteHighlight && (
              <>
                <span className="text-[#D4AF37]">{quoteHighlight}</span>
                {quoteParts[1]}
              </>
            )}
            {!quoteHighlight && home.strategicQuote}
            &rdquo;
          </p>
        </div>
      </div>

      <OurImpact content={home.ourImpact} />
      <WhatWeDo content={home.whatWeDo} />
      <StatsBar content={home.statsBar} />
      <SinetFlywheel content={home.flywheel} />
      <EmpirePreviewCards content={home.empirePreview} />
      <InvestorJourneyPreview content={home.investorJourney} />
      <TestimonialsSection content={home.testimonials} />
      <HomeCTA content={home.homeCta} />
    </>
  );
}
