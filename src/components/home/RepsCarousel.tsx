'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { Rep } from '@/types';
import { Card } from '../ui/Card';

export function RepsCarousel({ reps }: { reps: Rep[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === reps.length - 1 ? 0 : prev + 1));
  }, [reps.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? reps.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // Keep the currently selected rep card in view across breakpoints.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const child = scroller.children.item(currentIndex);
    if (!child) return;

    child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }, [currentIndex]);

  // If reps changes (or DB data loads differently), reset to a safe index.
  useEffect(() => {
    setCurrentIndex(0);
  }, [reps.length]);

  if (!reps.length) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Meet Our Reps</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our community representatives bridge the gap between global investors and local opportunities.
          </p>
        </div>

        <div className="relative max-w-md mx-auto xl:max-w-5xl lg:max-w-4xl md:max-w-2xl">
          <div
            ref={scrollerRef}
            className="flex overflow-x-auto px-4 pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {reps.map((rep) => (
              <div
                key={rep.id}
                className="snap-start w-full shrink-0 px-4 sm:w-1/2 lg:w-1/3 xl:w-1/4"
              >
                <Card className="p-6 text-center h-full">
                  <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 mb-4 overflow-hidden border border-slate-300 flex items-center justify-center text-slate-500 text-2xl font-bold relative">
                    <Image
                      src={rep.photoUrl}
                      alt={rep.altText}
                      fill
                      sizes="96px"
                      className="object-cover opacity-95"
                    />
                    <span className="relative z-10">{rep.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{rep.name}</h3>
                  <p className="text-sm font-medium text-blue-600 mt-1">{rep.region}</p>
                </Card>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button 
            onClick={prevSlide}
            className="absolute top-1/2 -left-2 md:-left-6 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 focus:outline-none"
            aria-label="Previous slide"
          >
            &larr;
          </button>
          <button 
            onClick={nextSlide}
            className="absolute top-1/2 -right-2 md:-right-6 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 focus:outline-none"
            aria-label="Next slide"
          >
            &rarr;
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center flex-wrap gap-2 mt-8">
          {reps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${idx === currentIndex ? 'bg-blue-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
