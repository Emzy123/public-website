'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';

const empires = [
  {
    id: 'food',
    emoji: '🍲',
    name: 'Food & Processing',
    color: 'orange',
    active: 'Trading essential food commodities across Nigeria — rice, beans, cassava, cooking oil. 6-week cycles with consistent off-take.',
    building: ['2 manufacturing plants processing raw crops into finished consumer goods', 'Location: Nigeria | Target completion in progress', 'Funded entirely by trade profits — no outside debt'],
    buildingProgress: 35,
    vision: 'A fully integrated Pan-African food supply chain. From farm to table across all 54 African nations. Students as food entrepreneurs and supply chain owners.',
    bgImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'tech',
    emoji: '💻',
    name: 'Tech & Innovation',
    color: 'blue',
    active: 'Developing the SINet digital portal for seamless investor management, cycle tracking, and returns transparency.',
    building: ['Fintech solutions for cross-border capital flow for African students', 'Investor dashboard with real-time cycle tracking', 'Mobile-first platform for the African student investor'],
    buildingProgress: 20,
    vision: 'The "Digital Backbone" for African student-led startups and ventures. A continental fintech layer connecting capital to opportunity across borders.',
    bgImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'fashion',
    emoji: '👗',
    name: 'Fashion & Creative',
    color: 'purple',
    active: 'Sourcing and distributing high-quality African textiles at scale. Active trade generating consistent returns in the creative goods market.',
    building: ['Creative hubs for young designers to scale their production capacity', 'Partnerships with Nigerian fashion schools and design institutes', 'Distribution networks for African-made goods to global markets'],
    buildingProgress: 15,
    vision: 'Global distribution for "Made in Africa" fashion brands. Nigerian and Pan-African fashion as a continental export industry worth billions.',
    bgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'realestate',
    emoji: '🏗️',
    name: 'Real Estate',
    color: 'green',
    active: 'Strategic land acquisition in high-growth student corridors across Nigerian university towns.',
    building: ['Modern, secure student housing — 5,000-bed hostel estate planned', 'Mixed-use student communities with co-working spaces', 'Locations targeting Nigeria\'s largest university cities'],
    buildingProgress: 10,
    vision: 'A network of "SINet Cities" — student-centric urban developments across Africa. Safe, affordable, connected communities for the next generation of African builders.',
    bgImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'agriculture',
    emoji: '🌾',
    name: 'Agriculture',
    color: 'yellow',
    active: 'Funding seasonal crop cycles with guaranteed off-take agreements. Active partnerships with smallholder farmers across Nigeria.',
    building: ['Smart-farming infrastructure and precision agriculture technology', 'Cold-storage facilities to reduce post-harvest losses', 'Partnerships with agri-input suppliers for discounted supply chains'],
    buildingProgress: 25,
    vision: 'Continental food security through student-led agricultural innovation. Nigeria as Africa\'s breadbasket, owned and operated by a new generation of agro-entrepreneurs.',
    bgImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=70',
  },
];

const colorMap: Record<string, { text: string }> = {
  orange: { text: 'text-orange-400' },
  blue: { text: 'text-blue-400' },
  purple: { text: 'text-purple-400' },
  green: { text: 'text-green-400' },
  yellow: { text: 'text-yellow-400' },
};

export default function EmpiresClient() {
  const [activeEmpire, setActiveEmpire] = useState(0);
  const empire = empires[activeEmpire];
  const colors = colorMap[empire.color];

  return (
    <div className="pt-20">
      <PageHero
        badge="The 5 Mega Empires"
        title="Five Sectors."
        titleAccent="One Vision."
        subtitle="From active trade to generational wealth. Each empire builds on the last. Together they form Africa's next great institution."
      />

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Empire Tabs */}
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

          {/* Empire detail */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
            {/* Hero image */}
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

            {/* 3 Layers */}
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Layer 1: Active */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-600 text-xs font-bold uppercase tracking-widest">Active Today</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{empire.active}</p>
              </div>

              {/* Layer 2: Building */}
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
                {/* Progress bar */}
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

              {/* Layer 3: Vision */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">The Vision</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{empire.vision}</p>
              </div>
            </div>
          </div>

          {/* Navigation between empires */}
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

          {/* CTA */}
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
