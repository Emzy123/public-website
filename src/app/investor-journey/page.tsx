import React from 'react';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('investor-journey', {
    title: 'Investor Journey',
    description: 'Structured 6-week investment cycle. Step-by-step guide to investing with SINet.',
  });
}

export default async function InvestorJourneyPage() {
  const { hero, tiers, tiersNote, timeline, withdrawalOptions, compoundingRows } = await getCmsContent('investor-journey');

  return (
    <div className="pt-20">
      <PageHero badge={hero.badge} title={hero.title} titleAccent={hero.titleAccent} subtitle={hero.subtitle} />

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <SectionHeader
            badge="Choose Your Entry"
            title="Investment"
            titleAccent="Tiers"
            subtitle="Choose your entry point. All tiers participate in the same 6-week structured investment cycles."
          />

          <div className="grid md:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl shadow-md border overflow-hidden hover:shadow-xl transition duration-300 ${
                  tier.premium
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 hover:border-[#D4AF37] relative scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-[#D4AF37]/50'
                }`}
              >
                {tier.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A2342] text-[#D4AF37] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 whitespace-nowrap">
                    Premium
                  </div>
                )}
                <div className={`py-4 px-6 ${tier.premium ? 'bg-[#D4AF37] text-[#0A2342]' : 'bg-[#0A2342] text-white'}`}>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-2xl font-bold text-[#0A2342] mb-2">{tier.range}</p>
                  <p className="text-slate-600 text-sm mb-4">{tier.description}</p>
                  <div className={`border-t pt-4 mt-4 ${tier.premium ? 'border-[#D4AF37]/20' : 'border-slate-100'}`}>
                    {tier.benefits.map((benefit) => (
                      <p key={benefit} className={`text-sm mb-2 ${tier.premium ? 'text-slate-600' : 'text-slate-500'}`}>✓ {benefit}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 mb-4">
            <p className="text-slate-500 text-sm tracking-wide">{tiersNote}</p>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200 shadow-lg text-base"
            >
              Contact to Start
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="The Cycle"
            title="Your 6-Week"
            titleAccent="Timeline"
            subtitle="Simple. Transparent. Consistent."
            dark
          />

          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-[#D4AF37]/30" />

            <div className="grid grid-cols-3 gap-4 relative">
              {timeline.map((item, i) => (
                <div key={item.week} className="text-center relative">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-extrabold text-sm shadow-lg border-2 ${
                    i === timeline.length - 1
                      ? 'bg-[#D4AF37] text-[#0A2342] border-[#D4AF37] shadow-[#D4AF37]/30'
                      : 'bg-[#0A1929] text-[#D4AF37] border-[#D4AF37]/50'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="text-[#D4AF37] text-xs font-mono uppercase tracking-widest mb-1">{item.week}</div>
                  <div className="text-white font-bold text-sm mb-1">{item.title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Your Choice"
            title="Reinvest or"
            titleAccent="Withdraw"
            subtitle="At the end of every 6-week cycle, you decide what to do with your money."
          />

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {withdrawalOptions.map((opt) => (
              <div key={opt.title} className="bg-[#F8F4E9] rounded-2xl p-8 border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-4">{opt.icon}</div>
                <h3 className="text-lg font-bold text-[#0A2342] mb-2">{opt.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{opt.desc}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A2342]/10 text-[#0A2342] text-xs font-semibold">
                  Best for: {opt.bestFor}
                </div>
              </div>
            ))}
          </div>

          <SectionHeader
            badge="The Math"
            title="Compounding"
            titleAccent="Example"
            subtitle="What happens if you reinvest every cycle starting with ₦50,000."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl">
              <thead>
                <tr className="bg-[#0A2342] text-white">
                  <th className="px-6 py-4 text-left font-semibold rounded-tl-xl whitespace-nowrap">Cycle</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Starting Capital</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Estimated Returns</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Asset Growth</th>
                  <th className="px-6 py-4 text-left font-semibold rounded-tr-xl text-[#D4AF37] whitespace-nowrap">New Total</th>
                </tr>
              </thead>
              <tbody>
                {compoundingRows.map((row, i) => (
                  <tr key={row.cycle} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8F4E9]'}>
                    <td className="px-6 py-4 font-bold text-[#0A2342]">Cycle {row.cycle}</td>
                    <td className="px-6 py-4 text-slate-700">{row.start}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{row.roi}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold">{row.appreciation}</td>
                    <td className="px-6 py-4 text-[#D4AF37] font-extrabold text-base">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400 text-xs mt-3 text-center">* Based on consistent cycle performance. Past performance does not guarantee future results.</p>

          <div className="text-center mt-10">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg text-base"
            >
              Start Your Compounding Journey →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
