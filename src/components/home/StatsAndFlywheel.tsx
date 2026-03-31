'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface StatItem {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

const stats: StatItem[] = [
  { value: '2M', label: 'Capital Deployed', prefix: '₦', suffix: '+' },
  { value: '15', label: 'ROI Per Cycle', suffix: '%' },
  { value: '6', label: 'Cycle Duration', suffix: ' Weeks' },
  { value: '5', label: 'Empires Building' },
];

function StatCounter({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  return (
    <div
      className={`text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="text-3xl md:text-4xl font-extrabold text-[#D4AF37] font-mono tabular-nums">
        {stat.prefix}{stat.value}{stat.suffix}
      </div>
      <div className="text-xs md:text-sm text-slate-300 mt-1 uppercase tracking-widest">{stat.label}</div>
    </div>
  );
}

export function StatsBar() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[#0A2342] border-y border-[#D4AF37]/20 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[#D4AF37]/20">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="transition-all duration-700"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <StatCounter stat={stat} isVisible={isVisible} />
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Capital currently deployed in active goods trade
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── FLYWHEEL ─────────────────────────────────────────────── */

const flywheelNodes = [
  { id: 'trade', label: 'Goods Trade', sub: 'Active Now', icon: '📦', href: '/blueprint', color: '#D4AF37' },
  { id: 'roi', label: '15% ROI + 5%', sub: 'Every 6 Weeks', icon: '📈', href: '/returns', color: '#F4D03F' },
  { id: 'manufacturing', label: 'Manufacturing', sub: '2 Plants Building', icon: '🏭', href: '/empires#food', color: '#D4AF37' },
  { id: 'hostel', label: 'Student Hostel', sub: '5,000-Bed Vision', icon: '🏘️', href: '/empires#realestate', color: '#F4D03F' },
  { id: 'empires', label: '5 Mega Empires', sub: 'Pan-African Future', icon: '🌍', href: '/empires', color: '#D4AF37' },
];

function FlywheelNode({ node, index, total }: { node: typeof flywheelNodes[0]; index: number; total: number }) {
  const angle = (index / total) * 360 - 90; // Start from top
  const rad = (angle * Math.PI) / 180;
  const r = 38; // radius in %
  const cx = 50 + r * Math.cos(rad);
  const cy = 50 + r * Math.sin(rad);

  return (
    <Link
      href={node.href}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${cx}%`, top: `${cy}%` }}
    >
      <div className="flex flex-col items-center gap-1.5 group-hover:scale-110 transition-transform duration-300">
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0A2342] border-2 flex items-center justify-center text-2xl md:text-3xl shadow-lg group-hover:shadow-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-all duration-300 animate-gold-pulse"
          style={{ borderColor: node.color }}
        >
          {node.icon}
        </div>
        <div className="text-center">
          <div className="text-xs md:text-sm font-bold text-white leading-tight">{node.label}</div>
          <div className="text-[10px] md:text-xs text-[#D4AF37]">{node.sub}</div>
        </div>
      </div>
    </Link>
  );
}

export function SinetFlywheel() {
  return (
    <section className="py-20 bg-[#0A1929] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">The Engine</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3 mb-4">
            The <span className="text-[#D4AF37]">SINet Flywheel</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Each cycle feeds the next. Trade profits build manufacturing. Manufacturing profits build empires. Your capital compounds at every stage.
          </p>
        </div>

        {/* Flywheel diagram */}
        <div className="relative mx-auto" style={{ maxWidth: 560, height: 560 }}>
          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/20" style={{ margin: '10%' }} />

          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#D4AF37] flex flex-col items-center justify-center text-[#0A2342] shadow-2xl">
              <span className="text-2xl font-extrabold leading-none">SI</span>
              <span className="text-xs font-bold">NET</span>
            </div>
          </div>

          {/* Nodes */}
          {flywheelNodes.map((node, i) => (
            <FlywheelNode key={node.id} node={node} index={i} total={flywheelNodes.length} />
          ))}

          {/* Animated arrows between nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            {flywheelNodes.map((_, i) => {
              const fromAngle = ((i / flywheelNodes.length) * 360 - 90) * (Math.PI / 180);
              const toAngle = (((i + 1) % flywheelNodes.length / flywheelNodes.length) * 360 - 90) * (Math.PI / 180);
              const r = 38;
              const x1 = 50 + r * Math.cos(fromAngle);
              const y1 = 50 + r * Math.sin(fromAngle);
              const x2 = 50 + r * Math.cos(toAngle);
              const y2 = 50 + r * Math.sin(toAngle);
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#D4AF37"
                  strokeWidth="0.3"
                  strokeDasharray="1.5 1"
                  opacity="0.4"
                />
              );
            })}
          </svg>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/blueprint"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#F4D03F] font-semibold transition-colors text-sm"
          >
            Learn how the model works
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
