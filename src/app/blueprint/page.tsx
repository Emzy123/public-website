import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';

export const metadata: Metadata = {
  title: 'The SINet Blueprint',
  description: 'How the SINet Trade-to-Asset model works. Active goods trade generates 15% ROI every 6 weeks, funding the 5 Mega Empires.',
  openGraph: {
    title: 'The SINet Blueprint | How It Works',
    description: 'Trade → Profits → Manufacturing → Real Estate → Empires. The complete model explained.',
  },
};

const cycleSteps = [
  { icon: '📦', number: '01', title: 'Capital Deployed', desc: 'Your capital is used to purchase high-demand consumer goods — essential commodities with guaranteed market demand.' },
  { icon: '🤝', number: '02', title: 'Goods Sold', desc: 'Goods are sold through established trade routes within 6 weeks. SINet cuts out middlemen for maximum margin.' },
  { icon: '📈', number: '03', title: 'ROI Credited', desc: 'You receive 15% ROI on your capital. Your capital also appreciates by 5%, compounding your wealth each cycle.' },
  { icon: '🏭', number: '04', title: 'SINet Reinvests', desc: 'A portion of trade profits is reinvested into long-term infrastructure — manufacturing plants, hostel estates, tech.' },
  { icon: '🌍', number: '05', title: 'Empires Grow', desc: 'As SINet scales from trade to manufacturing to real estate, return potential and asset value increase for all investors.' },
];

const whyPoints = [
  {
    icon: '⚡',
    title: 'Speed',
    desc: '6-week cycles vs. traditional 12–24 month investment horizons. Your money never idles.',
  },
  {
    icon: '🧱',
    title: 'Tangibility',
    desc: 'Your capital buys physical goods — not speculation, not derivatives. Real inventory. Real trade.',
  },
  {
    icon: '👁️',
    title: 'Transparency',
    desc: 'You see where money goes at every stage. Regular updates on trade cycles and project milestones.',
  },
];

export default function BlueprintPage() {
  return (
    <div className="pt-20">
      <PageHero
        badge="The Model"
        title="The SINet"
        titleAccent="Blueprint"
        subtitle="How active goods trade powers 15% ROI every 6 weeks — and funds the 5 Mega Empires being built across Africa."
      />

      {/* Engine & Destination */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="The Two Pillars"
            title="The Engine"
            titleAccent="& The Destination"
            subtitle="Every great model has a power source and a goal. SINet's engine is goods trade. The destination is Africa's most powerful institutions."
          />

          <div className="grid md:grid-cols-2 gap-8">
            {/* Engine */}
            <div className="bg-[#0A2342] rounded-2xl p-8 md:p-10 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center text-2xl">⚙️</div>
                <div>
                  <p className="text-[#D4AF37] text-xs uppercase tracking-widest font-semibold">The Engine</p>
                  <h2 className="text-2xl font-extrabold">Goods Trade</h2>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  'We buy high-demand consumer goods at wholesale',
                  'We sell within 6 weeks through established trade routes',
                  'This generates your 15% ROI per cycle',
                  'Your capital appreciates +5% every cycle',
                  'No speculation. No idle funds. Real transactions.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-200 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Destination */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#0A2342] flex items-center justify-center text-2xl">🌍</div>
                <div>
                  <p className="text-[#0A2342]/60 text-xs uppercase tracking-widest font-semibold">The Destination</p>
                  <h2 className="text-2xl font-extrabold text-[#0A2342]">The 5 Empires</h2>
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
                    <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Cycle of Wealth */}
      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Step by Step"
            title="The Cycle"
            titleAccent="of Wealth"
            subtitle="Five stages. Every six weeks. Repeating, compounding, growing."
            dark
          />

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[26px] md:left-1/2 top-0 bottom-0 w-px bg-[#D4AF37]/20 ml-0 md:-ml-px hidden md:block" />

            <div className="space-y-8">
              {cycleSteps.map((step, i) => (
                <div key={step.number} className={`flex gap-6 md:gap-8 items-start ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                  {/* Content card */}
                  <div className="flex-1 md:w-5/12">
                    <div className="bg-[#0A1929] rounded-2xl p-6 border border-slate-700/50 hover:border-[#D4AF37]/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{step.icon}</span>
                        <div>
                          <span className="text-[#D4AF37]/50 text-xs font-mono">{step.number}</span>
                          <h3 className="text-white font-bold text-lg">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex flex-shrink-0 w-14 h-14 rounded-full bg-[#D4AF37] items-center justify-center text-[#0A2342] font-extrabold text-sm shadow-lg shadow-[#D4AF37]/30">
                    {step.number}
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block md:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="The Advantage"
            title="Why This Model"
            titleAccent="Works"
            subtitle="Three principles that separate SINet from traditional investment platforms."
          />

          <div className="grid md:grid-cols-3 gap-8">
            {whyPoints.map((point) => (
              <div
                key={point.title}
                className="text-center p-8 rounded-2xl border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all duration-300 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#F8F4E9] group-hover:bg-[#D4AF37]/10 flex items-center justify-center text-3xl mx-auto mb-4 transition-colors">
                  {point.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0A2342] mb-3">{point.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/investor-journey"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg"
            >
              Start Your Journey →
            </Link>
            <Link
              href="/returns"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200"
            >
              See Track Record →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
