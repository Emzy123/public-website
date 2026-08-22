import Link from 'next/link';

export const metadata = {
  title: 'Products | SINet',
  description: 'Agricultural products, distributed goods, and available property opportunities across SINet\'s three pillars.',
};

const AREAS = [
  { title: 'Agricultural Products', body: 'Farm produce and agribusiness outputs from SINet\'s agriculture pillar — listed as verified inventory becomes available.', href: '/sectors#agriculture' },
  { title: 'Distributed Goods', body: 'Wholesale goods moving through SINet\'s trade & distribution network — markets, warehouses, and logistics.', href: '/sectors#trade' },
  { title: 'Property Opportunities', body: 'Available property listings and marketing opportunities under real estate — published only when verified.', href: '/sectors#real-estate' },
];

export default function ProductsPage() {
  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Products</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">What SINet offers.</h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">Three product areas aligned to our pillars — agricultural products, distributed goods, and property opportunities.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {AREAS.map((area) => (
            <article key={area.title} className="border border-[#0d1a4a]/20 bg-white p-6 md:p-8">
              <h2 className="font-editorial text-2xl">{area.title}</h2>
              <p className="mt-4 text-sm leading-6 text-[#5b554a]">{area.body}</p>
              <Link href={area.href} className="mt-6 inline-flex text-xs font-bold uppercase tracking-wider text-[#d9711b]">Related pillar →</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
