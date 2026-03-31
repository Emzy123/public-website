import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';

export const metadata: Metadata = {
  title: 'Investor Journey',
  description: 'Start with ₦50,000. Earn 15% ROI every 6 weeks. Step-by-step guide to investing with SINet.',
  openGraph: {
    title: 'Investor Journey | SINet',
    description: 'Choose your tier. Start a 6-week cycle. Earn 15% ROI + 5% appreciation.',
  },
};

const tiers = [
  {
    name: 'Seed',
    amount: '₦50,000',
    icon: '🌱',
    forWho: 'Students & first-time investors',
    perks: ['15% ROI per cycle', '+5% capital appreciation', 'Full flexibility to exit at cycle end', 'Access to SINet community'],
    cta: 'Start Here',
    highlight: false,
  },
  {
    name: 'Growth',
    amount: '₦250,000',
    icon: '🚀',
    forWho: 'Young professionals ready to accelerate',
    perks: ['15% ROI per cycle', '+5% capital appreciation', 'Priority cycle access', 'Quarterly portfolio review'],
    cta: 'Accelerate',
    highlight: true,
  },
  {
    name: 'Legacy',
    amount: '₦1M+',
    icon: '🏛️',
    forWho: 'Institutions & high-net-worth individuals',
    perks: ['15% ROI per cycle', '+5% capital appreciation', 'Dedicated relationship manager', 'Co-ownership consideration on empire assets'],
    cta: 'Partner With Us',
    highlight: false,
  },
];

const compoundingData = [
  { cycle: 1, start: '₦50,000', roi: '₦7,500', appreciation: '₦2,500', total: '₦60,000' },
  { cycle: 2, start: '₦60,000', roi: '₦9,000', appreciation: '₦3,000', total: '₦72,000' },
  { cycle: 3, start: '₦72,000', roi: '₦10,800', appreciation: '₦3,600', total: '₦86,400' },
  { cycle: 4, start: '₦86,400', roi: '₦12,960', appreciation: '₦4,320', total: '₦103,680' },
];

const withdrawalOptions = [
  {
    icon: '💸',
    title: 'Withdraw ROI',
    desc: 'Take your 15% profit every cycle. Your capital stays invested for the next cycle.',
    bestFor: 'Regular income',
  },
  {
    icon: '🔄',
    title: 'Withdraw All',
    desc: 'Take both ROI and capital at cycle end. Clean exit with full returns.',
    bestFor: 'Short-term needs',
  },
  {
    icon: '📈',
    title: 'Compound & Reinvest',
    desc: 'Reinvest ROI + appreciation. Next cycle grows on a larger base. Maximum wealth building.',
    bestFor: 'Long-term wealth',
  },
];

export default function InvestorJourneyPage() {
  return (
    <div className="pt-20">
      <PageHero
        badge="Your Roadmap"
        title="The Investor"
        titleAccent="Journey"
        subtitle="Start with ₦50,000. Earn 15% every 6 weeks. Build ownership in Africa's fastest-growing investment ecosystem."
      />

      {/* Tier Cards */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Choose Your Entry"
            title="Select Your"
            titleAccent="Investment Tier"
            subtitle="All tiers earn the same 15% ROI. Choose based on your starting capital."
          />

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  tier.highlight
                    ? 'bg-[#0A2342] text-white shadow-2xl shadow-[#0A2342]/30 scale-105'
                    : 'bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0A2342] text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="text-4xl mb-4">{tier.icon}</div>
                <div className="mb-6">
                  <div className={`text-xs uppercase tracking-widest font-semibold mb-1 ${tier.highlight ? 'text-[#D4AF37]' : 'text-[#0A2342]/60'}`}>
                    {tier.name}
                  </div>
                  <div className={`text-4xl font-extrabold mb-1 ${tier.highlight ? 'text-[#D4AF37]' : 'text-[#0A2342]'}`}>
                    {tier.amount}
                  </div>
                  <div className={`text-sm ${tier.highlight ? 'text-slate-300' : 'text-slate-500'}`}>{tier.forWho}</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-[#D4AF37]' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={tier.highlight ? 'text-slate-200' : 'text-slate-600'}>{perk}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/connect"
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] shadow-lg'
                      : 'bg-[#0A2342] hover:bg-[#1E3A5F] text-white'
                  }`}
                >
                  {tier.cta}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6-Week Timeline */}
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
            {/* Timeline line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-[#D4AF37]/30" />

            <div className="grid grid-cols-3 gap-4 relative">
              {[
                { week: 'Week 0', title: 'You Invest', desc: 'Capital deployed immediately into goods trade' },
                { week: 'Weeks 1–5', title: 'Capital Works', desc: 'Goods purchased, trade routes activated, sales executed' },
                { week: 'Week 6', title: '15% ROI + 5%', desc: 'ROI credited. Capital appreciated. Choose to reinvest or withdraw.' },
              ].map((item, i) => (
                <div key={item.week} className="text-center relative">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-extrabold text-sm shadow-lg border-2 ${
                    i === 2
                      ? 'bg-[#D4AF37] text-[#0A2342] border-[#D4AF37] shadow-[#D4AF37]/30'
                      : 'bg-[#0A1929] text-[#D4AF37] border-[#D4AF37]/50'
                  }`}>
                    {i === 0 ? '📥' : i === 1 ? '⚙️' : '💰'}
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

      {/* Withdrawal Strategies */}
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

          {/* Compounding Table */}
          <SectionHeader
            badge="The Math"
            title="Compounding"
            titleAccent="Example"
            subtitle="What happens if you reinvest every cycle starting with ₦50,000."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A2342] text-white">
                  <th className="px-6 py-4 text-left font-semibold rounded-tl-xl">Cycle</th>
                  <th className="px-6 py-4 text-left font-semibold">Starting Capital</th>
                  <th className="px-6 py-4 text-left font-semibold">ROI (15%)</th>
                  <th className="px-6 py-4 text-left font-semibold">Appreciation (5%)</th>
                  <th className="px-6 py-4 text-left font-semibold rounded-tr-xl text-[#D4AF37]">New Total</th>
                </tr>
              </thead>
              <tbody>
                {compoundingData.map((row, i) => (
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
