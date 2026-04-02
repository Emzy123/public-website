import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { FaqAccordion } from '@/components/ui/FaqAccordion';

export const metadata: Metadata = {
  title: 'Transparency & Governance',
  description: "SINet's No-Fail Commitment. Full transparency on operations, risk, and returns. FAQ for investors.",
  openGraph: {
    title: 'Transparency & Governance | SINet',
    description: 'Our commitment to operational transparency, risk mitigation, and direct access.',
  },
};

const commitments = [
  {
    icon: '👁️',
    title: 'Operational Transparency',
    desc: 'Regular updates on trade cycles, project milestones, and financial performance. You always know where your money is.',
  },
  {
    icon: '🛡️',
    title: 'Risk Mitigation',
    desc: 'Focus on high-demand, quick-turnover goods minimizes market exposure. Diversified goods portfolio reduces single-point failure.',
  },
  {
    icon: '☎️',
    title: 'Direct Access',
    desc: 'WhatsApp, email, and phone — human support always available. No chatbots. No automated responses for critical queries.',
  },
  {
    icon: '🏦',
    title: 'Capital Backing',
    desc: 'Your capital is backed by physical inventory and tangible assets in our Empires. Real goods. Real land. Real value.',
  },
];

const faqCategories = [
  {
    title: 'Money Safety',
    items: [
      {
        question: 'Is my money safe?',
        answer: 'Your capital is backed by physical inventory in our goods trade and tangible assets in our Empires. We do not speculate in currencies, crypto, or derivatives. Every naira you invest purchases real, tradeable goods.',
      },
      {
        question: 'What happens if a cycle has lower-than-expected returns?',
        answer: 'Our conservative inventory management and diversified goods portfolio minimize risk significantly. We select high-demand commodities with stable pricing and verified off-take partners. We maintain a buffer reserve to ensure investor returns remain consistent.',
      },
      {
        question: 'Who holds the capital during a cycle?',
        answer: 'Capital is held in SINet-managed accounts and deployed only into verified trade routes with established buyers. Funds are never held idle and are always traceable to specific inventory purchases.',
      },
    ],
  },
  {
    title: 'ROI & Returns',
    items: [
      {
        question: 'How are returns generated within 6 weeks?',
        answer: 'We cut out middlemen in the supply chain and trade directly in high-demand markets. This efficiency, combined with bulk purchasing power and established trade routes, creates significant margins within 6-week cycles.',
      },
      {
        question: 'Are returns guaranteed?',
        answer: 'Returns are based on actual trade and agricultural performance. Our track record shows consistent delivery across all completed cycles. While we do not legally guarantee returns (no investment is 100% risk-free), our model is designed to deliver consistent value creation.',
      },
      {
        question: 'How is capital appreciation calculated?',
        answer: 'As SINet\'s operational capacity grows — more trade volume, more agricultural output, more real assets — your invested capital\'s value increases proportionally. This appreciation reflects the growing enterprise value of the SINet ecosystem.',
      },
    ],
  },
  {
    title: 'Exit & Liquidity',
    items: [
      {
        question: 'What if I want to stop investing?',
        answer: 'You can exit at the end of any 6-week cycle with your full capital and earned returns. No penalties. No lock-in. Your money, your choice.',
      },
      {
        question: 'Can I withdraw mid-cycle?',
        answer: 'Capital is deployed in active trade during the cycle period. Mid-cycle withdrawal is not available as your funds are tied to physical inventory. However, you can exit fully at the end of each 6-week cycle.',
      },
      {
        question: 'How fast is withdrawal processed?',
        answer: 'Withdrawals are processed within 48 hours of cycle completion. You will receive confirmation and your capital + returns will be transferred to your designated account.',
      },
    ],
  },
  {
    title: 'General',
    items: [
      {
        question: 'Is SINet registered?',
        answer: 'SINet is a registered entity operating under Nigerian business law. Registration details will be made available to investors upon request during the onboarding process.',
      },
      {
        question: 'Who runs SINet?',
        answer: 'SINet is led by a team of Nigerian entrepreneurs, investment professionals, and trade specialists with deep expertise in African markets. Full leadership details are available on request.',
      },
      {
        question: 'How do I know this is legitimate?',
        answer: 'We invite any prospective investor to review our track record, speak directly to our team on WhatsApp, and request references from existing investors. Transparency is our core value — not a marketing claim.',
      },
    ],
  },
];

export default function TransparencyPage() {
  return (
    <div className="pt-20">
      <PageHero
        badge="Trust & Accountability"
        title="Transparency &"
        titleAccent="Governance"
        subtitle="We believe trust is earned through action, not words. Here is our commitment to every investor."
      />

      {/* JSON-LD FAQ schema */}
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

      {/* No-Fail Commitments */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Our Promise"
            title="The No-Fail"
            titleAccent="Commitment"
            subtitle="Four pillars that underpin every investment cycle and every investor relationship."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {commitments.map((c, i) => (
              <div
                key={c.title}
                className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Gold top accent */}
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

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Questions Answered"
            title="Frequently Asked"
            titleAccent="Questions"
            subtitle="Every question a smart investor should ask — answered honestly."
          />

          <FaqAccordion categories={faqCategories} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0A2342]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Still have questions?</h2>
          <p className="text-slate-300 mb-8">Talk directly to our team. No scripts. No delays. Real answers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/2349028239706"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all shadow-lg"
            >
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
