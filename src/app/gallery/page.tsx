'use client';

import { useState } from 'react';
import { PILLAR_LABELS, PILLARS, type Pillar } from '@/lib/types/membership';

/** Gallery items are managed in admin with required pillar tags. Placeholder structure until CMS items are seeded. */
const PLACEHOLDER: { pillar: Pillar; caption: string }[] = [];

export default function GalleryPage() {
  const [filter, setFilter] = useState<Pillar | 'all'>('all');
  const items = filter === 'all' ? PLACEHOLDER : PLACEHOLDER.filter((i) => i.pillar === filter);

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Gallery</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">Real activity across our pillars.</h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">Authentic photos and video from farms, warehouses, deliveries, markets, and properties — organized by sector, not as one mixed feed.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 py-10 xs:px-5 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All pillars</FilterButton>
          {PILLARS.map((p) => (
            <FilterButton key={p} active={filter === p} onClick={() => setFilter(p)}>{PILLAR_LABELS[p]}</FilterButton>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="mt-12 border border-dashed border-[#0d1a4a]/25 bg-white p-12 text-center">
            <p className="text-sm text-[#7b7263]">Gallery content will appear here as verified media is uploaded per pillar in the admin dashboard.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <figure key={i} className="border border-[#0d1a4a]/20 bg-white p-4">
                <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">{PILLAR_LABELS[item.pillar]}</p>
                <figcaption className="mt-2 text-sm text-[#5b554a]">{item.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#0d1a4a]/20 text-[#5b554a] hover:border-[#0d1a4a]'}`}>
      {children}
    </button>
  );
}
