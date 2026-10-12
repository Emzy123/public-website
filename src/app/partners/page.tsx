import Link from 'next/link';
import { getCmsContent, getDefaultContent } from '@/lib/cms';
import { catalogPillarLabel } from '@/lib/catalog';
import type { PartnersPageContent } from '@admin/types/content';

export const metadata = {
  title: 'Partners',
  description: 'Strategic partnerships across agriculture, trade & goods distribution, and real estate.',
};

export default async function PartnersPage() {
  let content: PartnersPageContent;
  try {
    content = await getCmsContent('partners-page');
  } catch {
    content = getDefaultContent('partners-page');
  }

  const items = [...content.items]
    .filter((item) => item.name.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">{content.hero.badge}</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">
            {content.hero.title}
          </h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">{content.hero.subtitle}</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const inner = (
              <>
                {item.logoUrl ? (
                  <div className="mb-5 h-14 w-full max-w-[160px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.logoUrl} alt="" className="h-full w-auto max-w-full object-contain object-left" />
                  </div>
                ) : null}
                <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">{catalogPillarLabel(item.pillar)}</p>
                <h2 className="mt-3 font-editorial text-2xl">{item.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5b554a]">{item.body}</p>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="border border-[#0d1a4a]/20 bg-white p-6 transition-colors hover:border-[#d9711b]"
              >
                {inner}
              </Link>
            ) : (
              <div key={item.id} className="border border-[#0d1a4a]/20 bg-white p-6">
                {inner}
              </div>
            );
          })}
        </div>
        <div className="mt-12 border border-[#0d1a4a]/20 bg-[#eee6d0] p-10 text-center">
          <p className="font-editorial text-2xl text-[#0d1a4a]">{content.ctaTitle}</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5b554a]">{content.ctaBody}</p>
          <Link
            href={content.ctaHref || '/contact'}
            className="mt-8 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9711b]"
          >
            {content.ctaLabel || 'Partner with us'}
          </Link>
        </div>
      </section>
    </div>
  );
}
