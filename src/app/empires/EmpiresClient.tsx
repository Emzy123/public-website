'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import type { EmpiresPageContent } from '@admin/types/content';

const colorMap: Record<string, { text: string }> = {
  orange: { text: 'text-orange-400' },
  blue: { text: 'text-blue-400' },
  purple: { text: 'text-purple-400' },
  green: { text: 'text-green-400' },
  yellow: { text: 'text-yellow-400' },
};

export default function EmpiresClient({ content }: { content: EmpiresPageContent }) {
  const empires = content.empires;
  const [activeEmpire, setActiveEmpire] = useState(0);
  const empire = empires[activeEmpire];
  const colors = colorMap[empire.color];

  return (
    <div className="pt-20">
      <PageHero
        badge={content.hero.badge}
        title={content.hero.title}
        titleAccent={content.hero.titleAccent}
        subtitle={content.hero.subtitle}
      />

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {empires.map((e, i) => (
              <button
                key={e.id}
                id={e.id}
                onClick={() => setActiveEmpire(i)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
                  i === activeEmpire
                    ? 'bg-[#0A2342] text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#D4AF37]/50 hover:text-[#0A2342]'
                }`}
              >
                <span>{e.emoji}</span>
                {e.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
            <div className="relative h-56 md:h-72 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${empire.bgImage}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A2342]/90 via-[#0A2342]/60 to-transparent" />
              <div className="absolute inset-0 flex items-center px-8 md:px-12">
                <div>
                  <span className="text-5xl mb-2 block">{empire.emoji}</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                    {empire.name}<span className="text-[#D4AF37]"> Empire</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-600 text-xs font-bold uppercase tracking-widest">Active Today</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{empire.active}</p>
              </div>

              <div className="p-8 bg-[#F8F4E9]/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className={`${colors.text} text-xs font-bold uppercase tracking-widest`}>Building Now</span>
                </div>
                <ul className="space-y-2.5 mb-4">
                  {empire.building.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-4 h-4 rounded bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#D4AF37] text-[10px] font-bold">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Construction Progress</span>
                    <span className="font-bold text-[#D4AF37]">{empire.buildingProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500" style={{ width: `${empire.buildingProgress}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">The Vision</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{empire.vision}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setActiveEmpire((activeEmpire - 1 + empires.length) % empires.length)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-[#D4AF37]/50 text-slate-600 hover:text-[#0A2342] text-sm font-medium transition-all"
            >
              ← Previous
            </button>
            <span className="text-slate-400 text-sm">{activeEmpire + 1} / {empires.length}</span>
            <button
              onClick={() => setActiveEmpire((activeEmpire + 1) % empires.length)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-[#D4AF37]/50 text-slate-600 hover:text-[#0A2342] text-sm font-medium transition-all"
            >
              Next →
            </button>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/investor-journey"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg text-base"
            >
              Invest in These Empires →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
