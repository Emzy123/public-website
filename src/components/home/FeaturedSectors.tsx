import React from 'react';
import type { Empire } from '@/types';
import { Card } from '../ui/Card';

export function FeaturedSectors({ empires }: { empires: Empire[] }) {
  const featured = empires.map(e => ({
    empireName: e.name,
    ...e.subSectors[0]
  })).slice(0, 4);

  return (
    <section className="relative py-24 bg-slate-900 text-white overflow-hidden">
      <div
        className="absolute -top-24 -left-28 w-[520px] h-[520px] opacity-25 pointer-events-none"
        style={{
          backgroundImage: "url('/images/bg-waves.svg')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
      />
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Investment Sectors</h2>
            <p className="text-lg text-slate-400">
              Preview the specific opportunities awaiting you inside the SINet portal.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((sector, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700 p-6 flex flex-col h-full hover:border-blue-500 transition-colors">
              <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-2">
                {sector.empireName}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{sector.name}</h3>
              <p className="text-slate-400 text-sm mb-6 flex-grow">{sector.description}</p>
              <div className="pt-4 border-t border-slate-700 mt-auto">
                <div className="text-xs text-slate-500 mb-1">Min. Investment</div>
                <div className="text-lg font-bold text-white">₦{sector.minInvestment.toLocaleString()}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
