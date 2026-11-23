import React from 'react';
import { Card } from '@/components/ui/Card';
import { AcademyInterestForm } from '@/components/forms/AcademyInterestForm';
import { AnimatedBg } from '@/components/ui/AnimatedBg';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('academy', {
    title: 'Investor Academy',
    description: 'Investor Academy — coming soon. Register interest for curriculum and masterclasses.',
  });
}

export default async function AcademyPage() {
  const { hero, learnItems, pathSteps } = await getCmsContent('academy');

  return (
    <div className="pt-24 pb-16">
      <section className="py-20 md:py-32 bg-sinet-blue text-white text-center relative overflow-hidden">
        <AnimatedBg className="absolute inset-0 w-full h-full opacity-30 z-0" variant="academy" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-sinet-gold/15 text-sinet-gold-light font-semibold tracking-wide text-sm mb-6 border border-sinet-gold/40">
            {hero.badge}
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            {hero.title}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-slate-200">
            {hero.subtitle}
          </p>
        </div>
      </section>

      <section className="py-24 bg-brand-canvas">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start max-w-7xl mx-auto">
            <div className="w-full lg:w-3/5">
              <div className="mb-16">
                <h2 className="font-heading text-3xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {learnItems.map((item) => (
                    <Card key={item.title} className="p-6 border-t-4 border-t-sinet-gold">
                      <div className="w-12 h-12 rounded-lg bg-sinet-blue/5 flex items-center justify-center mb-4 border border-sinet-gold/20 text-2xl">
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
                    <div key={step.number} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-sinet-blue text-sinet-gold flex items-center justify-center font-bold shrink-0 border border-sinet-gold/40">
                        {step.number}
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
