import React from 'react';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('transparency', {
    title: 'Transparency & Governance',
    description: "SINet's No-Fail Commitment. Full transparency on operations, risk, and returns. FAQ for investors.",
  });
}

export default async function TransparencyPage() {
  const { hero, commitments, faqCategories } = await getCmsContent('transparency');
  const settings = await getCmsContent('site-settings');

  return (
    <div className="pt-20">
      <PageHero badge={hero.badge} title={hero.title} titleAccent={hero.titleAccent} subtitle={hero.subtitle} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqCategories.flatMap((cat) =>
              cat.items.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              }))
            ),
          }),
        }}
      />

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader badge="Our Promise" title="The No-Fail" titleAccent="Commitment" subtitle="Four pillars that underpin every investment cycle and every investor relationship." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {commitments.map((c, i) => (
              <div key={c.title} className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="text-4xl mb-4">{c.icon}</div>
                <div className="text-[#D4AF37]/60 text-xs font-mono font-bold mb-2">0{i + 1}</div>
                <h3 className="text-lg font-bold text-[#0A2342] mb-3">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <SectionHeader badge="Questions Answered" title="Frequently Asked" titleAccent="Questions" subtitle="Every question a smart investor should ask — answered honestly." />
          <FaqAccordion categories={faqCategories} />
        </div>
      </section>

      <section className="py-16 bg-[#0A2342]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Still have questions?</h2>
          <p className="text-slate-300 mb-8">Talk directly to our team. No scripts. No delays. Real answers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={settings.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all shadow-lg">
              Chat on WhatsApp
            </a>
            <Link href="/connect" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 hover:bg-white/10 text-white font-medium rounded-xl transition-all">
              Send Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
