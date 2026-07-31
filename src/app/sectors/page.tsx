import React from 'react';
import { EmpireTabs } from '@/components/sectors/EmpireTabs';
import { getEmpires } from '@/lib/db/queries';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('sectors', {
    title: 'Investment Sectors | SINet',
    description: "Explore SINet's five investment Empires and their sub-sectors.",
  });
}

export const dynamic = 'force-dynamic';

export default async function SectorsPage() {
  const [empires, content] = await Promise.all([
    getEmpires(),
    getCmsContent('sectors-page'),
  ]);

  const { hero } = content;

  return (
    <div className="pt-24 pb-24 bg-white min-h-screen">
      <section className="container mx-auto px-4 md:px-6 mb-12 text-center md:text-left">
        {hero.badge && (
          <span className="inline-block text-xs uppercase tracking-[0.3em] font-semibold mb-4 px-4 py-1.5 rounded-full text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30">
            {hero.badge}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{hero.title}</h1>
        <p className="text-lg text-slate-600 max-w-2xl">{hero.subtitle}</p>
      </section>

      <section className="container mx-auto px-4 md:px-6">
        <EmpireTabs empires={empires} />
      </section>
    </div>
  );
}
