import React from 'react';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('blueprint', {
    title: 'The SINet Blueprint',
    description: 'How the SINet Trade-to-Asset model works. Structured 6-week investment cycle, funding the 5 Mega Empires.',
  });
}

export default async function BlueprintPage() {
  const { hero, cycleSteps, whyPoints } = await getCmsContent('blueprint');

  return (
    <div className="pt-20">
      <PageHero badge={hero.badge} title={hero.title} titleAccent={hero.titleAccent} subtitle={hero.subtitle} />

      <section className="py-20 bg-[#f6f2e8]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="The Two Pillars"
            title="The Engine"
            titleAccent="& The Destination"
            subtitle="Every great model has a power source and a goal. SINet's engine is goods trade. The destination is Africa's most powerful institutions."
          />

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0d1a4a] rounded-2xl p-8 md:p-10 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#d9711b] flex items-center justify-center text-2xl">⚙️</div>
                <div>
                  <p className="text-[#d9711b] text-xs uppercase tracking-widest font-semibold">The Engine</p>
                  <h2 className="text-2xl font-extrabold">Goods Trade</h2>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'We buy high-demand consumer goods at wholesale',
                  'We sell within 6 weeks through established trade routes',
                  'Profits distributed at end of each cycle',
                  'Returns generated through active goods trade and agricultural operations',
                  'No speculation. No idle funds. Real transactions.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-200 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#d9711b]/20 border border-[#d9711b]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#d9711b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#0d1a4a] flex items-center justify-center text-2xl">🌍</div>
                <div>
                  <p className="text-[#0d1a4a]/60 text-xs uppercase tracking-widest font-semibold">The Destination</p>
                  <h2 className="text-2xl font-extrabold text-[#0d1a4a]">The 5 Empires</h2>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'Trade profits are reinvested into long-term assets',
                  'Manufacturing plants, student hostels, tech infrastructure',
                  'These assets create generational wealth and income',
                  'You co-own these assets as an investor',
                  'Returns multiply as we scale from trade to empire',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#d9711b]/10 border border-[#d9711b]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#d9711b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0d1a4a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader badge="Step by Step" title="The Cycle" titleAccent="of Wealth" subtitle="Five stages. Every six weeks. Repeating, compounding, growing." dark />
          <div className="relative">
            <div className="absolute left-[26px] md:left-1/2 top-0 bottom-0 w-px bg-[#d9711b]/20 ml-0 md:-ml-px hidden md:block" />
            <div className="space-y-8">
              {cycleSteps.map((step, i) => (
                <div key={step.number} className={`flex gap-6 md:gap-8 items-start ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                  <div className="flex-1 md:w-5/12">
                    <div className="bg-[#0d1a4a] rounded-2xl p-6 border border-slate-700/50 hover:border-[#d9711b]/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{step.icon}</span>
                        <div>
                          <span className="text-[#d9711b]/50 text-xs font-mono">{step.number}</span>
                          <h3 className="text-white font-bold text-lg">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-shrink-0 w-14 h-14 rounded-full bg-[#d9711b] items-center justify-center text-[#0d1a4a] font-extrabold text-sm shadow-lg shadow-[#d9711b]/30">
                    {step.number}
                  </div>
                  <div className="flex-1 hidden md:block md:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* TODO-VERIFY: CEO approval needed for comparison wording */}
          <SectionHeader badge="The Advantage" title="Why This Model" titleAccent="Works" subtitle="Three principles that separate SINet from traditional business models." />
          <div className="grid md:grid-cols-3 gap-8">
            {whyPoints.map((point) => (
              <div key={point.title} className="text-center p-8 rounded-2xl border border-slate-200 hover:border-[#d9711b]/50 hover:shadow-xl hover:shadow-[#d9711b]/10 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-[#f6f2e8] group-hover:bg-[#d9711b]/10 flex items-center justify-center text-3xl mx-auto mb-4 transition-colors">
                  {point.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0d1a4a] mb-3">{point.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/membership" className="inline-flex items-center gap-2 px-8 py-4 bg-[#d9711b] hover:bg-[#b9560b] text-white font-bold transition-all duration-200 shadow-lg">
              Explore membership →
            </Link>
            <Link href="/sectors" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0d1a4a] hover:bg-[#16296b] text-white font-bold transition-all duration-200">
              See what we do →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
