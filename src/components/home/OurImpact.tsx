'use client';

import React, { useEffect, useRef, useState } from 'react';

const stats = [
  {
    value: '₦11.8M+',
    label: 'Capital Mobilized',
    sub: 'Deployed into active trade and agriculture',
    delay: 0,
  },
  {
    value: 'Multiple',
    label: 'Campuses',
    sub: 'Growing network of student investors',
    delay: 100,
  },
  {
    value: 'Active',
    label: 'Investment Cycles',
    sub: 'Agriculture and goods trade operations',
    delay: 200,
  },
];

export function OurImpact() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 bg-[#0A2342] relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(212,175,55,0.07)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">
            Measurable Results
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3 mb-4">
            Our <span className="text-[#D4AF37]">Impact</span>
          </h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full mb-6" />
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
            SINet is building a structured system that translates student potential into
            real economic value — measured in capital, communities, and production capacity.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center bg-[#0A1929] rounded-2xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all duration-500 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${s.delay}ms` }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-[#D4AF37] mb-3 font-mono leading-none">
                {s.value}
              </div>
              <p className="text-white font-bold text-lg mb-1">{s.label}</p>
              <p className="text-slate-400 text-sm">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Supporting bullets */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto border-t border-[#D4AF37]/10 pt-10 mb-10">
          {[
            'Ongoing development of processing and manufacturing systems',
            'Building a scalable model for youth-driven economic participation in Africa',
          ].map((point) => (
            <div key={point} className="flex items-start gap-3">
              <span className="text-[#D4AF37] font-bold text-lg mt-0.5 flex-shrink-0">→</span>
              <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        {/* Closing tagline */}
        <div className="text-center border-t border-[#D4AF37]/10 pt-10">
          <p className="text-[#D4AF37] font-semibold italic text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            &ldquo;SINet is not just creating returns — we are building ownership, production,
            and long-term economic systems.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
