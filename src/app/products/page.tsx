import Link from 'next/link';
import { getCmsContent, getDefaultContent } from '@/lib/cms';
import { catalogPillarLabel } from '@/lib/catalog';
import type { ProductsPageContent } from '@admin/types/content';

export const metadata = {
  title: 'Products',
  description:
    "Agricultural products, distributed goods, and available property opportunities across SINet's three pillars.",
};

export default async function ProductsPage() {
  let content: ProductsPageContent;
  try {
    content = await getCmsContent('products-page');
  } catch {
    content = getDefaultContent('products-page');
  }

  const items = [...content.items]
    .filter((item) => item.available && item.title.trim())
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
          {items.map((item) => (
            <article key={item.id} className="flex flex-col border border-[#0d1a4a]/20 bg-white">
              {item.imageUrl ? (
                <div className="h-44 w-full overflow-hidden bg-[#eee6d0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">{catalogPillarLabel(item.pillar)}</p>
                <h2 className="mt-3 font-editorial text-2xl">{item.title}</h2>
                <p className="mt-4 text-sm leading-6 text-[#5b554a]">{item.body}</p>
                {item.href ? (
                  <Link href={item.href} className="mt-6 inline-flex text-xs font-bold uppercase tracking-wider text-[#d9711b]">
                    Learn more →
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
