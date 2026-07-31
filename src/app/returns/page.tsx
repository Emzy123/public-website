import React from 'react';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('returns', {
    title: 'Returns & Track Record',
    description: 'SINet delivers returns through active goods trade and agricultural operations. Full transparency on returns.',
  });
}

export default async function ReturnsPage() {
  const { hero, disclaimer, currentReturns, statusLine, mechanicsSteps, trackRecord, futureSection } = await getCmsContent('returns');

  return (
    <div className="pt-20">
      <PageHero badge={hero.badge} title={hero.title} titleAccent={hero.titleAccent} subtitle={hero.subtitle} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What returns does SINet offer?',
                acceptedAnswer: { '@type': 'Answer', text: 'Profits are distributed at the end of every 6-week cycle, generated from real sector operations.' },
              },
            ],
          }),
        }}
      />

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 text-center sm:text-left mx-auto max-w-5xl mt-6 lg:rounded-md">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div>
            <p className="text-sm text-yellow-800">{disclaimer}</p>
          </div>
        </div>
      </div>

      <section className="py-12 bg-[#F8F4E9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Current Offering"
            title="Return"
            titleAccent="Summary"
            subtitle="All figures based on active goods trade performance."
          />

          <div className="bg-[#0A2342] rounded-2xl overflow-hidden">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#1E3A5F]">
              {currentReturns.map((item) => (
                <div key={item.metric} className="p-8 text-center">
                  <div className={`text-xl md:text-2xl font-extrabold mb-2 ${item.highlight ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {item.value}
                  </div>
                  <div className="text-slate-400 text-sm">{item.metric}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1E3A5F] p-5 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {statusLine}
              </span>
            </div>
          </div>
        </div>
      </section>

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
                SINet cuts out middlemen in the supply chain, trading directly in high-demand markets. This efficiency creates the margins that generate your returns.
              </p>
              <div className="bg-[#F8F4E9] rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-[#0A2342] mb-4 text-sm uppercase tracking-widest">Example Cycle</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: 'Investment', value: 'Initial Capital' },
                      { label: 'Profits Generated', value: 'Variable Returns', color: 'text-green-600' },
                      { label: 'Asset Growth', value: 'Long-Term Growth', color: 'text-blue-600' },
                      { label: 'Total Value', value: 'Capital + Returns', color: 'text-[#D4AF37] font-extrabold text-base' },
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
              {mechanicsSteps.map((step, i) => (
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
                  <th className="px-6 py-4 text-left font-semibold">Returns</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {trackRecord.map((row, i) => (
                  <tr key={row.cycle} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8F4E9]'}>
                    <td className="px-6 py-4 font-bold text-[#0A2342]">{row.cycle}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{row.period}</td>
                    <td className="px-6 py-4 text-[#D4AF37] font-extrabold">{row.result}</td>
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

      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <SectionHeader
            badge="The Future"
            title="Return"
            titleAccent="Potential"
            dark
          />
          {futureSection.paragraphs.map((p, i) => (
            <p key={i} className={`text-slate-300 leading-relaxed ${i < futureSection.paragraphs.length - 1 ? 'mb-4' : 'mb-10'}`}>{p}</p>
          ))}
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
