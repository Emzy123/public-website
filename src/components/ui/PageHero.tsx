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
    <section className={`border-b border-[#0d1a4a]/15 pt-28 pb-16 ${dark ? 'bg-[#0d1a4a]' : 'bg-[#f6f2e8]'}`}>
      <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
        {badge && (
          <span
            className={`mb-4 inline-block px-4 py-1.5 font-data text-[11px] font-semibold uppercase tracking-[0.16em] ${
              dark
                ? 'border border-[#d9711b]/40 bg-[#d9711b]/15 text-[#eccb7c]'
                : 'border border-[#0d1a4a]/20 bg-white text-[#d9711b]'
            }`}
          >
            {badge}
          </span>
        )}
        <h1
          className={`font-editorial text-4xl leading-[.92] tracking-[-.04em] md:text-6xl ${
            dark ? 'text-[#f6f2e8]' : 'text-[#0d1a4a]'
          }`}
        >
          {title} {titleAccent && <span className="text-[#d9711b]">{titleAccent}</span>}
        </h1>
        {subtitle && (
          <p
            className={`mx-auto mt-5 max-w-2xl text-lg leading-relaxed ${
              dark ? 'text-[#c9ccda]' : 'text-[#554e43]'
            }`}
          >
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

export function SectionHeader({
  badge,
  title,
  titleAccent,
  subtitle,
  dark = false,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      {badge && (
        <span className="font-data text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d9711b]">
          {badge}
        </span>
      )}
      <h2
        className={`mt-2 font-editorial text-3xl tracking-[-.03em] md:text-4xl ${
          dark ? 'text-[#f6f2e8]' : 'text-[#0d1a4a]'
        }`}
      >
        {title}
        {titleAccent && <span className="text-[#d9711b]"> {titleAccent}</span>}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-2xl leading-relaxed ${align === 'center' ? 'mx-auto' : ''} ${
            dark ? 'text-[#c9ccda]' : 'text-[#554e43]'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
