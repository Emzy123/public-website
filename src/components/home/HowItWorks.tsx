import React from 'react';
import { Card } from '../ui/Card';
import type { HowItWorksStep } from '@/lib/db/types';

const ICONS_BY_KEY: Record<HowItWorksStep['iconKey'], React.ReactNode> = {
  join: (
    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  verify: (
    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  invest: (
    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

const DEFAULT_STEPS: HowItWorksStep[] = [
  {
    number: '01',
    title: 'Join',
    description: 'Register your interest by joining our waitlist and creating your investor profile.',
    iconKey: 'join',
  },
  {
    number: '02',
    title: 'Verify',
    description: 'Complete our secure onboarding and KYC process to gain full access to the portal.',
    iconKey: 'verify',
  },
  {
    number: '03',
    title: 'Invest',
    description: 'Explore curated empires, select your preferred sectors, and build your portfolio.',
    iconKey: 'invest',
  },
];

export function HowItWorks({ steps }: { steps: HowItWorksStep[] }) {
  return (
    <section className="relative py-24 bg-slate-50 overflow-hidden">
      <div
        className="absolute -top-36 right-0 w-[560px] h-[560px] opacity-25 pointer-events-none"
        style={{
          backgroundImage: "url('/images/bg-waves.svg')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
      />
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your journey to owning a stake in Africa's most promising sectors is simple and secure.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(steps?.length ? steps : DEFAULT_STEPS).map((step, idx, arr) => (
            <div key={idx} className="relative">
              {idx !== arr.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full border-t-2 border-dashed border-blue-200" />
              )}
              <Card className="p-8 h-full relative z-10 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
                  {ICONS_BY_KEY[step.iconKey]}
                </div>
                <div className="text-5xl font-extrabold text-blue-50 absolute top-6 right-6 z-0 pointer-events-none">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{step.title}</h3>
                <p className="text-slate-600 relative z-10">{step.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
