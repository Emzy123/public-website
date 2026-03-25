import React from 'react';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { AcademyInterestForm } from '@/components/forms/AcademyInterestForm';
import { AnimatedBg } from '@/components/ui/AnimatedBg';

export const metadata: Metadata = {
  title: 'Investor Academy',
  description: 'Investor Academy — coming soon. Register interest for curriculum and masterclasses.',
  openGraph: {
    title: 'Investor Academy | SINet',
    description: 'Learn to evaluate opportunities and build an African portfolio—with experts.',
  },
};

const learnItems = [
  {
    title: 'Investment fundamentals',
    body: 'Risk, reward, and portfolio design for African markets.',
    icon: (
      <svg className="w-7 h-7 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Due diligence',
    body: 'Financials, founders, and red flags—practical frameworks you can reuse.',
    icon: (
      <svg className="w-7 h-7 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Sector deep dives',
    body: 'Empire-level nuance—from agribusiness to creative economies.',
    icon: (
      <svg className="w-7 h-7 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Regulatory navigation',
    body: 'Compliance, tax, and cross-border considerations explained clearly.',
    icon: (
      <svg className="w-7 h-7 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
];

const pathSteps = [
  { n: '1', title: 'Foundations', body: 'Self-paced modules on literacy, markets, and mindset.' },
  { n: '2', title: 'Masterclasses', body: 'Live sessions with operators, founders, and experts.' },
  { n: '3', title: 'Practical simulation', body: 'Term sheets, decks, and mock investment committees.' },
  { n: '4', title: 'Portfolio readiness', body: 'Templates and checkpoints before you deploy capital in Phase 1.' },
];

export default function AcademyPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="py-20 md:py-32 bg-sinet-blue text-white text-center relative overflow-hidden">
        <AnimatedBg className="absolute inset-0 w-full h-full opacity-30 z-0" variant="academy" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-sinet-gold/15 text-sinet-gold-light font-semibold tracking-wide text-sm mb-6 border border-sinet-gold/40">
            COMING SOON
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            Investor Academy – Coming Soon
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-slate-200">
            Build conviction with structured learning—so when the portal opens, you invest with clarity and discipline.
          </p>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start max-w-7xl mx-auto">
            <div className="w-full lg:w-3/5">
              <div className="mb-16">
                <h2 className="font-heading text-3xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {learnItems.map((item) => (
                    <Card key={item.title} className="p-6 border-t-4 border-t-sinet-gold">
                      <div className="w-12 h-12 rounded-lg bg-sinet-blue/5 flex items-center justify-center mb-4 border border-sinet-gold/20">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 font-heading">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-heading text-3xl font-bold text-slate-900 mb-6">The Learner&apos;s Path</h2>
                <div className="space-y-6">
                  {pathSteps.map((step) => (
                    <div key={step.n} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-sinet-blue text-sinet-gold flex items-center justify-center font-bold shrink-0 border border-sinet-gold/40">
                        {step.n}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg font-heading">{step.title}</h4>
                        <p className="text-slate-600">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/5 md:sticky md:top-24">
              <AcademyInterestForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
