import React from 'react';

interface PageHeroProps {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  dark?: boolean;
}

export function PageHero({ badge, title, titleAccent, subtitle, dark = true }: PageHeroProps) {
  return (
    <section className={`pt-32 pb-16 ${dark ? 'bg-[#0A2342]' : 'bg-[#F8F4E9]'}`}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        {badge && (
          <span className={`inline-block text-xs uppercase tracking-[0.3em] font-semibold mb-4 px-4 py-1.5 rounded-full ${
            dark ? 'text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'text-[#0A2342] bg-[#0A2342]/10 border border-[#0A2342]/20'
          }`}>
            {badge}
          </span>
        )}
        <h1 className={`text-4xl md:text-6xl font-extrabold leading-tight mb-4 ${dark ? 'text-white' : 'text-[#0A2342]'}`}>
          {title}{' '}
          {titleAccent && <span className="text-[#D4AF37]">{titleAccent}</span>}
        </h1>
        {subtitle && (
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  dark?: boolean;
  align?: 'left' | 'center';
}

export function SectionHeader({ badge, title, titleAccent, subtitle, dark = false, align = 'center' }: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      {badge && (
        <span className="text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">{badge}</span>
      )}
      <h2 className={`text-3xl md:text-4xl font-extrabold mt-2 mb-3 ${dark ? 'text-white' : 'text-[#0A2342]'}`}>
        {title}{titleAccent && <span className="text-[#D4AF37]"> {titleAccent}</span>}
      </h2>
      {subtitle && (
        <p className={`max-w-2xl ${align === 'center' ? 'mx-auto' : ''} leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
