import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';

export const metadata: Metadata = {
  title: 'Impact & The Student Movement',
  description: 'SINet believes every African student should graduate with a portfolio, not just a certificate. Join the movement of ownership and empowerment.',
  openGraph: {
    title: 'Impact & The Student Movement | SINet',
    description: 'Building African Owners. Not just investors — Owners.',
  },
};

const roles = [
  {
    icon: '🎓',
    title: 'Campus Ambassador',
    desc: 'Lead the SINet movement on your campus. Educate peers, recruit investors, and earn commission on referrals.',
    cta: 'Apply as Ambassador',
  },
  {
    icon: '🏗️',
    title: 'Student Builder',
    desc: 'Run real projects within our 5 Empires. Gain hands-on experience in trade, real estate, tech, and manufacturing.',
    cta: 'Become a Builder',
  },
  {
    icon: '📱',
    title: 'Content Creator',
    desc: 'Tell the SINet story. Create content that inspires the next generation of African investors and owners.',
    cta: 'Create With Us',
  },
];

const ownership = [
  { icon: '📦', label: 'Goods Inventory', desc: 'The physical goods in our active trade cycles' },
  { icon: '🏭', label: 'Manufacturing Plants', desc: 'The 2 plants currently being built' },
  { icon: '🏘️', label: 'Student Hostels', desc: 'Serving thousands of students across Nigeria' },
  { icon: '💻', label: 'Tech Infrastructure', desc: 'The digital backbone of African student business' },
];

export default function ImpactPage() {
  return (
    <div className="pt-20">
      <PageHero
        badge="The Mission"
        title="Impact & The"
        titleAccent="Student Movement"
        subtitle="Every year, thousands of African students graduate with degrees but no capital, no network, no platform. SINet changes that."
      />

      {/* From Certificate to Capital */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">The Problem</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3 mb-6">
                From Certificate<br />to <span className="text-[#D4AF37]">Capital</span>
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Every year, thousands of African students graduate with degrees but no capital, no network, no platform to fund their visions.
                </p>
                <p>
                  They graduate knowing <em>what</em> to do — in theory. But with no resources to do it. No seed capital. No connections. No institutional support.
                </p>
                <p className="font-semibold text-[#0A2342] text-lg">SINet changes that.</p>
                <p>
                  We believe every student should graduate with more than a certificate. They should graduate with a <strong>Portfolio</strong> — ownership in real businesses, manufacturing, real estate, and technology.
                </p>
                <div className="inline-block bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-6 py-4 mt-2">
                  <p className="text-[#0A2342] font-bold text-sm">This is not charity. This is empowerment.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: '₦50,000', label: 'Minimum to start building ownership', bg: 'bg-[#0A2342]', text: 'text-[#D4AF37]' },
                { stat: '6 Weeks', label: 'To your first returns. No waiting years.', bg: 'bg-[#D4AF37]', text: 'text-[#0A2342]' },
                { stat: '5 Empires', label: 'Real sectors. Real assets. Real ownership.', bg: 'bg-[#F8F4E9]', text: 'text-[#0A2342]' },
                { stat: '1 Movement', label: 'Pan-African. Student-powered. Built to last.', bg: 'bg-[#0A2342]', text: 'text-white' },
              ].map((item) => (
                <div key={item.stat} className={`${item.bg} rounded-2xl p-6`}>
                  <div className={`text-3xl font-extrabold ${item.text} mb-2`}>{item.stat}</div>
                  <div className={`text-sm ${item.text === 'text-[#D4AF37]' || item.text === 'text-[#0A2342]' ? 'opacity-70' : 'text-slate-300'} leading-tight`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Building African Owners */}
      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">The Shift</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 mb-4">
              Building African <span className="text-[#D4AF37]">Owners</span>
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              When you invest in SINet, you are not just "investing." You are <strong className="text-white">Owning</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {ownership.map((item) => (
              <div key={item.label} className="glass-card rounded-2xl p-6 text-center hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{item.label}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center bg-[#0A1929] rounded-2xl p-8 border border-[#D4AF37]/20">
            <p className="text-slate-300 text-lg leading-relaxed mb-2">
              We are not creating investors. We are creating
            </p>
            <p className="text-[#D4AF37] text-3xl font-extrabold">Owners.</p>
          </div>
        </div>
      </section>

      {/* Become a Builder */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge="Join Us"
            title="Become a"
            titleAccent="Builder"
            subtitle="SINet is built by students, for students. Join in any capacity — every role matters."
          />

          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role) => (
              <div
                key={role.title}
                className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{role.icon}</div>
                <h3 className="text-xl font-bold text-[#0A2342] mb-3 group-hover:text-[#D4AF37] transition-colors">{role.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{role.desc}</p>
                <Link
                  href="/connect"
                  className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold text-sm hover:text-[#F4D03F] transition-colors"
                >
                  {role.cta}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200 text-base"
            >
              Join the Movement →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
