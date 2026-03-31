'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const slides = [
  {
    id: 'slide-1',
    bgUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=2400&q=80',
    badge: '🔴 LIVE NOW',
    headline: '15% ROI Every',
    headlineAccent: '6 Weeks',
    subheadline: '+5% Capital Appreciation. Active Goods Trade. Real Returns.',
    cta: { label: 'See How It Works', href: '/blueprint' },
    ctaSecondary: { label: 'Start with ₦50,000', href: '/investor-journey' },
  },
  {
    id: 'slide-2',
    bgUrl: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?auto=format&fit=crop&w=2400&q=80',
    badge: '🏗️ BUILDING NOW',
    headline: '2 Manufacturing Plants',
    headlineAccent: 'Under Construction',
    subheadline: 'Funded by Trade Profits. Building Nigeria\'s Production Capacity.',
    cta: { label: 'Explore Our Assets', href: '/empires' },
    ctaSecondary: { label: 'Join the Movement', href: '/impact' },
  },
  {
    id: 'slide-3',
    bgUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=2400&q=80',
    badge: '🌍 THE VISION',
    headline: '5 Mega Empires.',
    headlineAccent: 'One Movement.',
    subheadline: 'Fashion • Food Processing • Tech • Real Estate • Agriculture',
    cta: { label: 'Explore the 5 Empires', href: '/empires' },
    ctaSecondary: { label: 'Our Returns', href: '/returns' },
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(next, 6000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero carousel"
    >
      {/* Background images — prerender all for instant transitions */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${s.bgUrl}')` }}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A2342]/95 via-[#0A2342]/75 to-[#0A2342]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342]/80 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              key={`badge-${current}`}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6 animate-fade-in-up"
            >
              <span>{slide.badge}</span>
            </div>

            {/* Headline */}
            <h1
              key={`h1-${current}`}
              className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4 animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              {slide.headline}{' '}
              <span className="text-gold-shimmer">{slide.headlineAccent}</span>
            </h1>

            {/* Subheadline */}
            <p
              key={`sub-${current}`}
              className="text-lg md:text-xl text-slate-200 mb-10 leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {slide.subheadline}
            </p>

            {/* CTAs */}
            <div
              key={`ctas-${current}`}
              className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href={slide.cta.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#D4AF37]/40 hover:shadow-xl text-base"
              >
                {slide.cta.label}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href={slide.ctaSecondary.href}
                className="inline-flex items-center justify-center px-8 py-4 text-white border border-white/30 hover:bg-white/10 hover:border-white/50 rounded-xl transition-all duration-200 font-medium text-base backdrop-blur-sm"
              >
                {slide.ctaSecondary.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-8 h-2.5 bg-[#D4AF37]'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Arrow navigation */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div
          key={`progress-${current}`}
          className="h-full bg-[#D4AF37] origin-left"
          style={{
            animation: paused ? 'none' : 'progressFill 6s linear forwards',
            '--target-width': '100%',
          } as React.CSSProperties}
        />
      </div>
    </section>
  );
}
