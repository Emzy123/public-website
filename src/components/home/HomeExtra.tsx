import React from 'react';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: '💰',
    title: 'Choose Your Entry',
    tiers: ['₦50,000 – Seed', '₦250,000 – Growth', '₦1M+ – Legacy'],
    color: 'border-[#D4AF37]',
  },
  {
    number: '02',
    icon: '📦',
    title: '6-Week Cycle',
    tiers: ['Capital deployed to goods trade', 'High-demand markets', 'Zero idle time'],
    color: 'border-[#1E3A5F]',
  },
  {
    number: '03',
    icon: '📈',
    title: 'Reinvest or Withdraw',
    tiers: ['15% ROI credited', '+5% Capital appreciation', 'Full flexibility at cycle end'],
    color: 'border-[#D4AF37]',
  },
];

const testimonials = [
  {
    quote: 'I started with ₦50,000. Six weeks later, I had ₦60,000. SINet delivered exactly what they promised.',
    name: 'Investor',
    location: 'Lagos',
  },
  {
    quote: 'What I love is knowing my money is buying real goods, not just sitting somewhere. I can see the impact.',
    name: 'Investor',
    location: 'Abuja',
  },
  {
    quote: 'The compounding potential here is incredible. Third cycle in and my capital has grown significantly.',
    name: 'Investor',
    location: 'Port Harcourt',
  },
];

export function InvestorJourneyPreview() {
  return (
    <section className="py-20 bg-[#0A2342]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">Simple Process</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3 mb-4">
            How to <span className="text-[#D4AF37]">Get Started</span>
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Three steps. Six weeks. Real returns. No complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12 relative">
          {/* Arrow connectors */}
          <div className="hidden md:block absolute top-12 left-[34%] w-[10%] text-[#D4AF37]/40 text-xl text-center z-10">→</div>
          <div className="hidden md:block absolute top-12 left-[65%] w-[10%] text-[#D4AF37]/40 text-xl text-center z-10">→</div>

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative bg-[#0A1929] rounded-2xl border border-slate-700/50 p-8 hover:border-[#D4AF37]/50 transition-all duration-300 group"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`absolute top-0 left-8 right-8 h-0.5 ${step.color.replace('border-', 'bg-')} rounded-b-full`} />
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <span className="text-[#D4AF37]/50 text-xs font-mono font-bold">{step.number}</span>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                </div>
              </div>
              <ul className="space-y-2">
                {step.tiers.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/investor-journey"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#D4AF37]/30 text-base"
          >
            Start Your Journey
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">Social Proof</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3 mb-4">
            Investors Are <span className="text-[#D4AF37]">Already Winning</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.location}
              className="bg-[#F8F4E9] rounded-2xl p-8 border border-slate-200 hover:border-[#D4AF37]/40 hover:shadow-lg transition-all duration-300 relative"
            >
              <div className="text-[#D4AF37] text-5xl font-serif leading-none mb-4">&ldquo;</div>
              <p className="text-slate-700 leading-relaxed mb-6 italic">{t.quote}</p>
              <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                <div className="w-10 h-10 rounded-full bg-[#0A2342] flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-[#0A2342] text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0A2342] via-[#1E3A5F] to-[#0A2342] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.12)_0%,_transparent_70%)]" />

      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Ready to Build <span className="text-gold-shimmer">Africa's Future?</span>
        </h2>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          Talk to our team. No pressure. Just clarity. Start with ₦50,000 and earn 15% every 6 weeks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/2349028239706"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#D4AF37]/40 text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Connect on WhatsApp
          </a>
          <Link
            href="/connect"
            className="inline-flex items-center justify-center px-8 py-4 text-white border border-white/30 hover:bg-white/10 hover:border-white/50 rounded-xl transition-all duration-200 font-medium text-base"
          >
            Send an Inquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
