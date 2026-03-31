import React from 'react';
import Link from 'next/link';

const empires = [
  {
    id: 'food',
    emoji: '🍲',
    name: 'Food & Processing',
    teaser: '2 manufacturing plants under construction',
    status: 'building',
    statusLabel: 'Building Now',
    href: '/empires#food',
    gradient: 'from-orange-600/20 to-orange-900/10',
  },
  {
    id: 'tech',
    emoji: '💻',
    name: 'Tech & Innovation',
    teaser: 'Investor portal in active development',
    status: 'building',
    statusLabel: 'In Development',
    href: '/empires#tech',
    gradient: 'from-blue-600/20 to-blue-900/10',
  },
  {
    id: 'fashion',
    emoji: '👗',
    name: 'Fashion & Creative',
    teaser: 'Textile trade active across Nigeria',
    status: 'active',
    statusLabel: 'Active Now',
    href: '/empires#fashion',
    gradient: 'from-purple-600/20 to-purple-900/10',
  },
  {
    id: 'realestate',
    emoji: '🏗️',
    name: 'Real Estate',
    teaser: '5,000-bed student hostel estate planned',
    status: 'vision',
    statusLabel: 'Planning Phase',
    href: '/empires#realestate',
    gradient: 'from-green-600/20 to-green-900/10',
  },
  {
    id: 'agriculture',
    emoji: '🌾',
    name: 'Agriculture',
    teaser: 'Seasonal crop cycles funded & active',
    status: 'active',
    statusLabel: 'Active Now',
    href: '/empires#agriculture',
    gradient: 'from-yellow-600/20 to-yellow-900/10',
  },
];

const statusConfig = {
  active: { dot: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  building: { dot: 'bg-[#D4AF37]', text: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/30' },
  vision: { dot: 'bg-blue-400', text: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
};

export function EmpirePreviewCards() {
  return (
    <section className="py-20 bg-[#F8F4E9]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">Building Africa</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0A2342] mt-3 mb-4">
            The <span className="text-[#D4AF37]">5 Mega Empires</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Five sectors. One ecosystem. From active trade to long-term ownership — your capital is always working.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {empires.map((empire) => {
            const sc = statusConfig[empire.status as keyof typeof statusConfig];
            return (
              <Link
                key={empire.id}
                href={empire.href}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-[#D4AF37]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col"
              >
                {/* Empire emoji */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${empire.gradient} border border-slate-200 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {empire.emoji}
                </div>

                {/* Status badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold mb-3 ${sc.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${empire.status === 'active' ? 'animate-pulse' : ''}`} />
                  <span className={sc.text}>{empire.statusLabel}</span>
                </div>

                <h3 className="text-base font-bold text-[#0A2342] mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {empire.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{empire.teaser}</p>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore Empire
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>

                {/* Hover gold top border */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/empires"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200 text-sm"
          >
            Deep-Dive Into All 5 Empires
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
