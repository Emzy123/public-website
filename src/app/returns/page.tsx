import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';

export const metadata: Metadata = {
  title: 'Returns & Track Record',
  description: 'SINet delivers 15% ROI + 5% capital appreciation every 6 weeks through active goods trade. Full transparency on returns.',
  openGraph: {
    title: 'Returns & Track Record | SINet',
    description: '15% ROI every 6 weeks. 5% capital appreciation. Backed by real goods trade.',
  },
};

const currentReturns = [
  { metric: 'Minimum Investment', value: '₦50,000', highlight: false },
  { metric: 'ROI Per Cycle', value: '15%', highlight: true },
  { metric: 'Capital Appreciation', value: '+5% per cycle', highlight: true },
  { metric: 'Cycle Duration', value: '6 Weeks', highlight: false },
  { metric: 'Payout Timing', value: 'End of each cycle', highlight: false },
  { metric: 'Current Status', value: '✅ Open – Capital deployed', highlight: false },
];

const trackRecord = [
  { cycle: 'Cycle 4', period: 'Date – Date', roi: '15%', appreciation: '5%', total: '20%', status: 'Paid' },
  { cycle: 'Cycle 3', period: 'Date – Date', roi: '15%', appreciation: '5%', total: '20%', status: 'Paid' },
  { cycle: 'Cycle 2', period: 'Date – Date', roi: '15%', appreciation: '5%', total: '20%', status: 'Paid' },
  { cycle: 'Cycle 1', period: 'Date – Date', roi: '15%', appreciation: '5%', total: '20%', status: 'Paid' },
];

export default function ReturnsPage() {
  return (
    <div className="pt-20">
      <PageHero
        badge="Full Transparency"
        title="Returns &"
        titleAccent="Track Record"
        subtitle="15% ROI + 5% capital appreciation every 6 weeks. Generated through active goods trade. No speculation."
      />

      {/* Schema markup for Investment type */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What ROI does SINet offer?',
                acceptedAnswer: { '@type': 'Answer', text: '15% ROI per 6-week cycle plus 5% capital appreciation.' },
              },
            ],
          }),
        }}
      />

      {/* ── Risk Disclaimer ── */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>
              <p className="font-bold text-amber-800 text-sm">Important Risk Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                All investments carry risk. Past returns do not guarantee future results. The information on this page is for educational purposes only. Conduct your own research and consult a qualified financial advisor before investing. SINet is not a registered investment advisor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Returns Summary */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Current Offering"
            title="Return"
            titleAccent="Summary"
            subtitle="All figures based on active goods trade performance."
          />

          <div className="bg-[#0A2342] rounded-2xl overflow-hidden">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1E3A5F]">
              {currentReturns.map((item) => (
                <div key={item.metric} className="p-8 text-center">
                  <div className={`text-2xl md:text-3xl font-extrabold mb-2 ${item.highlight ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {item.value}
                  </div>
                  <div className="text-slate-400 text-sm">{item.metric}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1E3A5F] p-5 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Currently accepting new investors — capital is being deployed in active trade cycles
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How Returns Are Generated */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="The Mechanics"
            title="How Returns"
            titleAccent="Are Generated"
          />

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-slate-600 leading-relaxed mb-6">
                Your capital is deployed in active goods trade — purchasing high-demand consumer goods (food commodities, essential household items) and selling through established trade routes within 6 weeks.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                SINet cuts out middlemen in the supply chain, trading directly in high-demand markets. This efficiency creates the margins that generate your 15% ROI.
              </p>
              <div className="bg-[#F8F4E9] rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-[#0A2342] mb-4 text-sm uppercase tracking-widest">Example Cycle</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: 'Investment', value: '₦50,000' },
                      { label: '15% ROI (after 6 weeks)', value: '+₦7,500', color: 'text-green-600' },
                      { label: '5% Capital Appreciation', value: '+₦2,500', color: 'text-blue-600' },
                      { label: 'Total Value', value: '₦60,000', color: 'text-[#D4AF37] font-extrabold text-base' },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-3 text-slate-500">{row.label}</td>
                        <td className={`py-3 font-bold text-right ${row.color || 'text-[#0A2342]'}`}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: '🛒', title: 'Capital Deployed', desc: 'Funds purchase of high-demand consumer goods at wholesale.' },
                { icon: '🚚', title: 'Trade Executed', desc: 'Goods moved through verified trade routes across Nigeria.' },
                { icon: '💵', title: 'Sales Converted', desc: 'Revenue realized within the 6-week window.' },
                { icon: '✅', title: 'ROI Distributed', desc: '15% + 5% credited to your account. Choose to reinvest or withdraw.' },
              ].map((step, i) => (
                <div key={step.title} className="flex items-start gap-4 p-5 bg-[#F8F4E9] rounded-xl border border-slate-200">
                  <span className="w-10 h-10 rounded-xl bg-[#0A2342] flex items-center justify-center text-2xl flex-shrink-0">{step.icon}</span>
                  <div>
                    <div className="font-bold text-[#0A2342] text-sm mb-1">Step {i + 1}: {step.title}</div>
                    <div className="text-slate-500 text-xs leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Track Record Table */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="History"
            title="Completed"
            titleAccent="Cycles"
            subtitle="Every cycle. Every payout. Full record. (Update dates as cycles complete.)"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
              <thead>
                <tr className="bg-[#0A2342] text-white">
                  <th className="px-6 py-4 text-left font-semibold">Cycle</th>
                  <th className="px-6 py-4 text-left font-semibold">Period</th>
                  <th className="px-6 py-4 text-left font-semibold">ROI Paid</th>
                  <th className="px-6 py-4 text-left font-semibold">Appreciation</th>
                  <th className="px-6 py-4 text-left font-semibold">Total Return</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {trackRecord.map((row, i) => (
                  <tr key={row.cycle} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8F4E9]'}>
                    <td className="px-6 py-4 font-bold text-[#0A2342]">{row.cycle}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">[Add dates]</td>
                    <td className="px-6 py-4 text-green-600 font-bold">{row.roi}</td>
                    <td className="px-6 py-4 text-blue-500 font-bold">{row.appreciation}</td>
                    <td className="px-6 py-4 text-[#D4AF37] font-extrabold">{row.total}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400 text-xs mt-3 text-center">Note: Dates will be populated as cycles complete. This table is designed for easy manual updates.</p>
        </div>
      </section>

      {/* Future Potential */}
      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <SectionHeader
            badge="The Future"
            title="Return"
            titleAccent="Potential"
            dark
          />
          <p className="text-slate-300 leading-relaxed mb-4">
            As SINet scales from trade → manufacturing → real estate, return potential grows. Manufacturing assets will create new revenue streams. The 5,000-bed hostel estate will generate long-term passive income. Your capital grows with us.
          </p>
          <p className="text-slate-300 leading-relaxed mb-10">
            Investors who join early co-own the assets being built today. Early participation means maximum upside as the empires scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/investor-journey" className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg">
              Start Investing →
            </Link>
            <Link href="/transparency" className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 hover:bg-white/10 text-white font-medium rounded-xl transition-all duration-200">
              Read Our Commitments
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
