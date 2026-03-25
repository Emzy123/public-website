import { HeroSection } from '@/components/home/HeroSection';
import { VisionStatement } from '@/components/home/VisionStatement';
import { FiveEmpiresGrid } from '@/components/home/FiveEmpiresGrid';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedSectors } from '@/components/home/FeaturedSectors';
import { RepsCarousel } from '@/components/home/RepsCarousel';
import { WaitlistPreview } from '@/components/home/WaitlistPreview';
import type { Metadata } from 'next';
import { getEmpires, getHowItWorksSteps, getReps } from '@/lib/db/queries';

export const metadata: Metadata = {
  // Uses layout defaults
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [empires, reps, steps] = await Promise.all([
    getEmpires(),
    getReps(),
    getHowItWorksSteps(),
  ]);

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
            logo: 'https://sinet.africa/logo.png',
            description: "Pan-African Investment Ecosystem platform",
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'contact@sinet.africa',
              contactType: 'customer support'
            }
          })
        }}
      />
      <HeroSection />
      <VisionStatement />
      <FiveEmpiresGrid empires={empires} />
      <HowItWorks steps={steps} />
      <FeaturedSectors empires={empires} />
      <RepsCarousel reps={reps} />
      <WaitlistPreview />
    </>
  );
}
