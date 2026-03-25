'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { TeamMember } from '@/types';
import { Card } from '../ui/Card';

export function TeamCarousel({ teamMembers }: { teamMembers: TeamMember[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => teamMembers ?? [], [teamMembers]);

  const scrollByAmount = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;

    // Scroll by ~1 card width (responsive-safe).
    const amount = Math.max(260, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }, []);

  if (!items.length) return null;

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Meet the Team</h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
          We’re a hands-on team across operations, technology, and deal execution—working together to democratise African wealth creation.
        </p>

        <div className="relative max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label="Previous team members"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600"
          >
            &larr;
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {items.map((member) => (
              <div
                key={member.id}
                className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-[300px]"
              >
                <Card className="p-0 text-center overflow-hidden h-full">
                  <div className="px-4 pt-4">
                    <div className="aspect-square bg-slate-200 w-full relative rounded-xl overflow-hidden group">
                      {member.photoUrl ? (
                        <>
                          <Image
                            src={member.photoUrl}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                          {/* Hover overlay with full details */}
                          <div className="absolute inset-0 bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center px-4 text-center">
                            <div className="font-bold text-lg">{member.name}</div>
                            <div className="text-white/90 mt-1">{member.title}</div>
                            <div className="text-white/80 text-sm mt-3">Hover details</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          No photo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name + office below the photo */}
                  <div className="p-6 pt-4">
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-blue-600 font-medium mt-1">{member.title}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label="Next team members"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600"
          >
              &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}

