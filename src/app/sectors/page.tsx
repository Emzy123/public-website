import React from 'react';
import type { Metadata } from 'next';
import { EmpireTabs } from '@/components/sectors/EmpireTabs';
import { getEmpires } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Investment Sectors | SINet',
  description: 'Explore SINet\'s five investment Empires and their sub-sectors.',
  openGraph: {
    title: 'Investment Sectors | SINet',
    description: 'Explore SINet\'s five investment Empires and their sub-sectors.',
  }
};

export const dynamic = 'force-dynamic';

export default async function SectorsPage() {
  const empires = await getEmpires();

  return (
    <div className="pt-24 pb-24 bg-white min-h-screen">
      <section className="container mx-auto px-4 md:px-6 mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Our Investment Empires</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Discover scalable, impactful, and thoroughly vetted investment opportunities across Africa’s most critical sectors.
        </p>
      </section>

      <section className="container mx-auto px-4 md:px-6">
        <EmpireTabs empires={empires} />
      </section>
    </div>
  );
}
