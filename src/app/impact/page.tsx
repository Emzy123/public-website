import React from 'react';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/ui/PageHero';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('impact', {
    title: 'Impact & The Student Movement',
    description: 'SINet believes every African student should graduate with a portfolio, not just a certificate. Join the movement of ownership and empowerment.',
  });
}

const STAT_STYLES = [
  { bg: 'bg-[#0A2342]', text: 'text-[#D4AF37]' },
  { bg: 'bg-[#D4AF37]', text: 'text-[#0A2342]' },
  { bg: 'bg-[#F8F4E9]', text: 'text-[#0A2342]' },
  { bg: 'bg-[#0A2342]', text: 'text-white' },
];

export default async function ImpactPage() {
  const { hero, certificateSection, ownershipSection, rolesSection } = await getCmsContent('impact');

  return (
    <div className="pt-20">
      <PageHero badge={hero.badge} title={hero.title} titleAccent={hero.titleAccent} subtitle={hero.subtitle} />

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">{certificateSection.eyebrow}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3 mb-6">
                {certificateSection.title}<br />to <span className="text-[#D4AF37]">{certificateSection.titleAccent}</span>
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                {certificateSection.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="inline-block bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-6 py-4 mt-2">
                  <p className="text-[#0A2342] font-bold text-sm">{certificateSection.highlight}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {certificateSection.stats.map((item, i) => {
                const style = STAT_STYLES[i % STAT_STYLES.length];
                return (
                  <div key={item.stat} className={`${style.bg} rounded-2xl p-6`}>
                    <div className={`text-3xl font-extrabold ${style.text} mb-2`}>{item.stat}</div>
                    <div className={`text-sm ${style.text === 'text-[#D4AF37]' || style.text === 'text-[#0A2342]' ? 'opacity-70' : 'text-slate-300'} leading-tight`}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">{ownershipSection.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 mb-4">
              {ownershipSection.title} <span className="text-[#D4AF37]">{ownershipSection.titleAccent}</span>
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">{ownershipSection.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {ownershipSection.items.map((item) => (
              <div key={item.label} className="glass-card rounded-2xl p-6 text-center hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{item.label}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center bg-[#0A1929] rounded-2xl p-8 border border-[#D4AF37]/20">
            <p className="text-slate-300 text-lg leading-relaxed mb-2">{ownershipSection.closingLine}</p>
            <p className="text-[#D4AF37] text-3xl font-extrabold">{ownershipSection.closingAccent}</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader
            badge={rolesSection.eyebrow}
            title={rolesSection.title}
            titleAccent={rolesSection.titleAccent}
            subtitle={rolesSection.subtitle}
          />

          <div className="grid md:grid-cols-3 gap-8">
            {rolesSection.roles.map((role) => (
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
              href={rolesSection.ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200 text-base"
            >
              {rolesSection.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
