import React from 'react';

const sectors = [
  {
    icon: '🌾',
    title: 'Agriculture & Processing',
    badge: null,
    href: '/empires#agriculture',
  },
  {
    icon: '📦',
    title: 'Trade & Distribution',
    badge: null,
    href: '/blueprint',
  },
  {
    icon: '🏭',
    title: 'Manufacturing',
    badge: 'Developing',
    href: '/empires#food',
  },
  {
    icon: '💻',
    title: 'Technology & Innovation',
    badge: 'Developing',
    href: '/empires#tech',
  },
  {
    icon: '🤝',
    title: 'Enterprise & Investment Network',
    badge: null,
    href: '/investor-journey',
  },
];

export function WhatWeDo() {
  return (
    <section className="py-20 bg-[#F8F4E9]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">
            Sector Operations
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0A2342] mt-3 mb-4">
            What We <span className="text-[#D4AF37]">Do</span>
          </h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full mb-6" />
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SINet operates across key sectors to build a complete, interconnected economic
            system — from farm to factory to financial network.
          </p>
        </div>

        {/* Sector cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {sectors.map((s) => (
            <a
              key={s.title}
              href={s.href}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Icon circle */}
              <div className="w-16 h-16 rounded-full bg-[#0A2342]/8 border border-[#0A2342]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all duration-300">
                <span className="text-2xl">{s.icon}</span>
              </div>

              <h3 className="font-bold text-[#0A2342] text-sm leading-tight group-hover:text-[#D4AF37] transition-colors">
                {s.title}
              </h3>

              {s.badge && (
                <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                  {s.badge}
                </span>
              )}
            </a>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            Each sector feeds the others — creating a self-reinforcing economic engine for Africa.
          </p>
        </div>
      </div>
    </section>
  );
}
