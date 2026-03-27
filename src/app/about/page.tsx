import React from 'react';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';
import { getTeamMembers } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Vision, mission, and the SINet difference—building a Pan-African investment ecosystem for ownership and scale.',
  openGraph: {
    title: 'About Us | SINet',
    description:
      'Vision, mission, and the SINet difference—building a Pan-African investment ecosystem for ownership and scale.',
  },
};

export const dynamic = 'force-dynamic';

const differences = [
  {
    title: 'Ownership, not hustle',
    body: 'We design for long-term equity, governance, and compounding—not speculative noise.',
    icon: (
      <svg className="w-8 h-8 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Hyper-local expertise',
    body: 'Regional reps and operators anchor every thesis in real markets, compliance, and culture.',
    icon: (
      <svg className="w-8 h-8 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Radical transparency',
    body: 'Structured diligence, clear reporting, and disciplined communication across the network.',
    icon: (
      <svg className="w-8 h-8 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: 'Pan-African by design',
    body: 'Five mega-empires connect capital to opportunity across borders—with shared standards.',
    icon: (
      <svg className="w-8 h-8 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Impact with discipline',
    body: 'We back projects that can scale returns and outcomes—jobs, infrastructure, and resilience.',
    icon: (
      <svg className="w-8 h-8 text-sinet-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const advisoryBoard: { name: string; title: string }[] = [];

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();

  return (
    <div className="pt-24 pb-16">
      <section className="py-20 bg-sinet-blue text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">About SINet</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-slate-200">
            A Pan-African investment ecosystem connecting capital to real projects—built for ownership, trust, and scale.
          </p>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="p-10 border-t-4 border-t-sinet-gold">
              <div className="w-16 h-16 rounded-full bg-sinet-blue/10 flex items-center justify-center mb-6 border border-sinet-gold/30">
                <span className="text-2xl" role="img" aria-label="">
                  👁️
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading">Vision</h2>
              <p className="text-slate-600 leading-relaxed">
                Raise a generation of system builders and investors who shape industries, influence global markets, and
                position Africa as a leading force in the world economy—through ownership, not hustle.
              </p>
            </Card>

            <Card className="p-10 border-t-4 border-t-sinet-blue">
              <div className="w-16 h-16 rounded-full bg-sinet-gold/15 flex items-center justify-center mb-6 border border-sinet-gold/40">
                <span className="text-2xl" role="img" aria-label="">
                  🎯
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading">Mission</h2>
              <p className="text-slate-600 leading-relaxed">
                Build a dynamic network that funds ideas, executes strategic investments, and connects talent across key
                sectors—using collaboration, technology, and global opportunities to create wealth and lasting economic
                systems.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-12 text-center">The SINet Difference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {differences.map((d) => (
              <Card key={d.title} className="p-8 border border-slate-100 hover:border-sinet-gold/30 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-sinet-blue/5 flex items-center justify-center mb-4 border border-sinet-gold/20">
                  {d.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-heading">{d.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{d.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-12 text-center">Leadership Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.id} className="text-center overflow-hidden h-full border-t-4 border-t-sinet-gold">
                <div className="aspect-square bg-slate-200 w-full relative overflow-hidden group">
                  {member.photoUrl ? (
                    <>
                      <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-sinet-blue/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center px-4 text-center z-10">
                        <div className="font-bold text-lg">{member.name}</div>
                        <div className="text-white/90 mt-1">{member.title}</div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/70 border border-white flex items-center justify-center text-slate-700 text-3xl font-bold">
                        {member.name?.trim()?.charAt(0) || '?'}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 font-heading">{member.name}</h3>
                  <p className="text-sinet-blue font-medium">{member.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {advisoryBoard.length > 0 ? (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-12 text-center">Advisory Board</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {advisoryBoard.map((advisor) => (
                <div key={advisor.name} className="text-center">
                  <div className="w-32 h-32 rounded-full bg-slate-200 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900">{advisor.name}</h3>
                  <p className="text-sm text-slate-500">{advisor.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
