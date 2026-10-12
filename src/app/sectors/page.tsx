import Link from 'next/link';

const PILLARS = [
  { id: 'agriculture', title: 'Agriculture', body: 'Production, aggregation, processing, and agribusiness — building practical enterprise from the ground up across Nigeria.' },
  { id: 'trade', title: 'Trade & Goods Distribution', body: 'Wholesale supply, logistics, and distribution — connecting producers to markets and communities to goods.' },
  { id: 'real-estate', title: 'Real Estate', body: 'Property marketing, strategic partnerships, and future development — with verified listings and real partners only.' },
];

export const metadata = {
  title: 'What We Do',
  description: 'SINet\'s three equal pillars: Agriculture, Trade & Goods Distribution, and Real Estate.',
};

export default function SectorsPage() {
  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">What we do</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,6rem)] leading-[.86] tracking-[-.06em]">Three pillars. Equal weight.</h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">Agriculture, Trade &amp; Goods Distribution, and Real Estate work together as the foundation of SINet&apos;s business ecosystem.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.id} id={pillar.id} className="min-h-[280px] border border-[#0d1a4a]/20 bg-white p-6 scroll-mt-24 xs:p-8 md:min-h-[320px]">
              <h2 className="font-editorial text-3xl leading-[.9] tracking-[-.05em]">{pillar.title}</h2>
              <p className="mt-6 text-[17px] leading-7 text-[#5b554a]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#0d1a4a] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 md:gap-10 lg:grid-cols-2">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#eccb7c]">See it in action</p>
            <h2 className="mt-5 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.9] tracking-[-.05em]">Real proof, organized by pillar.</h2>
          </div>
          <div className="self-end">
            <p className="leading-7 text-[#c9ccda]">Visit the gallery for authentic photos and video from each pillar — farms, warehouses, deliveries, and properties.</p>
            <Link href="/gallery" className="mt-7 inline-flex border border-[#eccb7c] px-6 py-3 text-sm font-bold text-[#eccb7c] hover:bg-[#eccb7c] hover:text-[#0d1a4a]">View Gallery →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
