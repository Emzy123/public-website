'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    id: 'platform',
    eyebrow: 'Pan-African community & investment platform',
    headline: (
      <>
        Capital that
        <br className="hidden sm:block" /> moves. <em className="font-normal text-[#d9a23c]">Openly.</em>
      </>
    ),
    body: 'SINet builds community and enterprise through property, participation, and transparent reporting — making room for individuals, professionals, businesses, and students to create lasting value.',
    primary: { label: 'Explore Investment Plans', href: '/investment-plans' },
    secondary: { label: 'See What We Do', href: '/sectors' },
    stats: [
      ['₦100M', '18-month cash flow target'],
      ['3', 'focus areas'],
      ['Q + A', 'reporting culture'],
    ] as const,
    visual: 'orb' as const,
  },
  {
    id: 'plans',
    eyebrow: 'Investment plans',
    headline: (
      <>
        Two ways to
        <br className="hidden sm:block" /> participate.
      </>
    ),
    body: 'Choose a cadence that fits your capital and timeline. Both plans follow the same investment policy, review process, and reporting standards. Returns shown are targets, not guarantees.',
    primary: { label: 'Compare plans in full', href: '/investment-plans' },
    secondary: { label: 'Start Investing', href: '/start-investing' },
    stats: [
      ['5%', 'quarterly declaration'],
      ['15%', 'annual declaration'],
      ['Q + A', 'same reporting'],
    ] as const,
    visual: 'returns' as const,
  },
  {
    id: 'students',
    eyebrow: 'Student Network',
    headline: (
      <>
        Built by students,
        <br className="hidden sm:block" /> still at the core.
      </>
    ),
    body: 'SINet began with a student community. The Student Network remains a dedicated pathway to verified membership, learning, and responsible participation.',
    primary: { label: 'Visit the Student Network', href: '/student-network' },
    secondary: { label: 'Get Involved', href: '/get-involved' },
    stats: [
      ['01', 'student pathway'],
      ['Open', 'membership route'],
      ['Learn', 'then participate'],
    ] as const,
    visual: 'mark' as const,
  },
];

function HeroVisual({ kind }: { kind: (typeof SLIDES)[number]['visual'] }) {
  if (kind === 'returns') {
    return (
      <div className="absolute bottom-16 right-[6%] hidden w-[320px] border border-[#0d1a4a]/20 bg-[#0d1a4a] p-8 text-[#f6f2e8] lg:block xl:w-[380px]">
        <p className="font-data text-[11px] uppercase tracking-[.14em] text-[#eccb7c]">Target returns</p>
        <div className="mt-6 flex items-end justify-between border-b border-white/20 pb-5">
          <span className="text-sm">Quarterly</span>
          <span className="font-editorial text-5xl tracking-[-.04em] text-[#eccb7c]">5%</span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <span className="text-sm">Annual</span>
          <span className="font-editorial text-5xl tracking-[-.04em] text-[#eccb7c]">15%</span>
        </div>
      </div>
    );
  }

  if (kind === 'mark') {
    return (
      <div className="absolute bottom-16 right-[6%] hidden h-[355px] w-[355px] items-center justify-center lg:flex xl:h-[430px] xl:w-[430px]">
        <div className="absolute inset-0 rounded-full border-2 border-[#d9711b] border-dotted opacity-70" />
        <div className="absolute inset-[12%] rounded-full border border-[#0d1a4a]/15" />
        <div className="flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[#d9711b] font-editorial text-3xl text-[#f6f2e8]">01</div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-16 right-[6%] hidden h-[355px] w-[355px] items-center justify-center lg:flex xl:h-[430px] xl:w-[430px]">
      <div className="absolute inset-0 rounded-full border-2 border-[#d9a23c] border-dotted opacity-70" />
      <div className="absolute inset-[12%] rounded-full border border-[#0d1a4a]/15" />
      <div className="absolute inset-[30%] rounded-full border border-[#0d1a4a]" />
      <div className="flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[#173229] font-editorial text-xl text-[#f6f2e8]">
        Value
        <br />→ Trust
      </div>
      <span className="absolute left-1/2 top-[-8px] h-3 w-3 rounded-full bg-[#d9a23c]" />
    </div>
  );
}

export function InstitutionalHero() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative mx-auto min-h-[min(700px,calc(100vh-77px))] max-w-[1380px] overflow-hidden px-4 pb-20 pt-12 xs:px-5 md:min-h-[min(800px,calc(100vh-77px))] md:pb-24 md:pt-16 lg:px-8 lg:pt-24"
      aria-roledescription="carousel"
      aria-label="SINet introduction"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const delta = start - end;
        if (Math.abs(delta) < 48) return;
        if (delta > 0) next();
        else prev();
      }}
    >
      <div className="absolute -right-32 top-24 h-64 w-64 rounded-full border border-[#0d1a4a]/10 xs:h-80 xs:w-80 md:-right-48 md:top-40 md:h-[36rem] md:w-[36rem] lg:-right-[21rem] lg:top-[10rem] lg:h-[54rem] lg:w-[54rem]" />
      <div className="absolute -right-16 top-32 h-48 w-48 rounded-full border border-[#d9a23c] border-dotted xs:h-60 xs:w-60 md:-right-24 md:top-48 md:h-[28rem] md:w-[28rem] lg:-right-[10rem] lg:top-[16rem] lg:h-[42rem] lg:w-[42rem]" />

      {SLIDES.map((item, index) => (
        <div
          key={item.id}
          className={`relative z-10 max-w-[740px] ${index === current ? 'block animate-fade-in-up' : 'hidden'}`}
          aria-hidden={index !== current}
          aria-live={index === current ? 'polite' : undefined}
        >
          <p className="mb-8 flex items-center gap-3 font-data text-[11px] uppercase tracking-[.16em] text-[#60594d]">
            <span className="h-px w-7 bg-[#d9711b]" /> {item.eyebrow}
          </p>
          <h1 className="max-w-[690px] font-editorial text-[clamp(3.4rem,8vw,8.7rem)] leading-[.84] tracking-[-.07em] text-[#0d1a4a]">
            {item.headline}
          </h1>
          <p className="mt-12 max-w-[455px] text-[17px] leading-7 text-[#464238]">{item.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={item.primary.href}
              className="bg-[#0d1a4a] px-7 py-4 text-center text-sm font-bold text-white transition-colors hover:bg-[#d9711b]"
            >
              {item.primary.label}
            </Link>
            <Link
              href={item.secondary.href}
              className="border border-[#0d1a4a] px-7 py-4 text-center text-sm font-bold transition-colors hover:border-[#d9711b] hover:text-[#d9711b]"
            >
              {item.secondary.label}
            </Link>
          </div>
          <div className="mt-10 grid max-w-[490px] grid-cols-3 border-l border-[#0d1a4a]/20 md:mt-16">
            {item.stats.map(([value, label]) => (
              <div key={label} className="border-r border-[#0d1a4a]/20 px-4 first:pl-0">
                <div className="font-editorial text-3xl tracking-[-.04em]">{value}</div>
                <div className="mt-1 text-[11px] leading-4 text-[#635e54]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <HeroVisual kind={slide.visual} />

      <div className="absolute bottom-8 left-5 right-5 z-20 flex items-center justify-between lg:left-8 lg:right-8">
        <div className="flex items-center gap-3">
          <span className="font-data text-[11px] uppercase tracking-[.16em] text-[#60594d]">
            {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
          <div className="flex gap-2">
            {SLIDES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show slide ${index + 1}: ${item.eyebrow}`}
                aria-current={index === current}
                className="relative flex h-11 w-11 items-center justify-center"
              >
                <span className={`block h-2 transition-all ${
                  index === current ? 'w-8 bg-[#0d1a4a]' : 'w-2 bg-[#0d1a4a]/25'
                }`} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="flex h-11 w-11 items-center justify-center border border-[#0d1a4a]/25 text-[#0d1a4a] transition-colors hover:border-[#d9711b] hover:text-[#d9711b]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="square" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="flex h-11 w-11 items-center justify-center border border-[#0d1a4a]/25 text-[#0d1a4a] transition-colors hover:border-[#d9711b] hover:text-[#d9711b]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="square" strokeWidth={1.8} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

    </section>
  );
}
