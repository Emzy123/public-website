'use client';

import Link from 'next/link';

const PILLARS = [
  {
    name: 'Agriculture',
    body: 'Production, aggregation, processing, and agribusiness — building practical enterprise from the ground up.',
    href: '/sectors#agriculture',
  },
  {
    name: 'Trade & Goods Distribution',
    body: 'Wholesale supply, logistics, and distribution across Nigeria — connecting producers to markets.',
    href: '/sectors#trade',
  },
  {
    name: 'Real Estate',
    body: 'Property marketing, strategic partnerships, and future development — with verified, real listings only.',
    href: '/sectors#real-estate',
  },
];

export function InstitutionalHero() {
  return (
    <section className="relative mx-auto max-w-[1380px] overflow-hidden px-4 pb-20 pt-12 xs:px-5 md:pb-24 md:pt-16 lg:px-8 lg:pt-24">
      <div className="absolute -right-32 top-24 h-64 w-64 rounded-full border border-[#0d1a4a]/10 md:h-[36rem] md:w-[36rem] lg:-right-[21rem] lg:top-[10rem] lg:h-[54rem] lg:w-[54rem]" />
      <div className="relative z-10 max-w-[780px]">
        <p className="mb-8 flex items-center gap-3 font-data text-[11px] uppercase tracking-[.16em] text-[#60594d]">
          <span className="h-px w-7 bg-[#d9711b]" /> A business ecosystem built on community
        </p>
        <h1 className="max-w-[690px] font-editorial text-[clamp(3rem,7.5vw,7rem)] leading-[.88] tracking-[-.07em] text-[#0d1a4a]">
          One Community. Three Pillars. Endless Opportunities.
        </h1>
        <p className="mt-10 max-w-[520px] text-[17px] leading-7 text-[#464238]">
          Agriculture, Trade &amp; Goods Distribution, and Real Estate work together to create sustainable businesses and long-term impact.
        </p>
        <p className="mt-6 max-w-[520px] text-sm italic leading-7 text-[#5b554a]">
          &ldquo;Investment is one of our tools — not our identity. Our identity is community.&rdquo;
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/membership" className="bg-[#0d1a4a] px-7 py-4 text-center text-sm font-bold text-white transition-colors hover:bg-[#d9711b]">Join SINet</Link>
          <Link href="/contact" className="border border-[#0d1a4a] px-7 py-4 text-center text-sm font-bold transition-colors hover:border-[#d9711b] hover:text-[#d9711b]">Partner With Us</Link>
          <Link href="/products" className="border border-[#0d1a4a] px-7 py-4 text-center text-sm font-bold transition-colors hover:border-[#d9711b] hover:text-[#d9711b]">View Products</Link>
        </div>
      </div>
    </section>
  );
}

export function InstitutionalHome() {
  return (
    <div className="overflow-hidden bg-[#f6f2e8] text-[#0d1a4a]">
      <InstitutionalHero />

      {/* About */}
      <section className="border-y border-[#0d1a4a]/20 bg-[#eee6d0] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">About SINet</p>
            <h2 className="mt-5 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.92] tracking-[-.05em]">A company built on three equal pillars.</h2>
          </div>
          <p className="self-end text-lg leading-8 text-[#524d43]">
            SINet is a business ecosystem offering products, services, partnerships, and community membership — not primarily an investment platform. We build through agriculture, trade &amp; distribution, and real estate, with people at the centre.
          </p>
        </div>
      </section>

      {/* Three Pillars — equal weight */}
      <section className="mx-auto max-w-[1180px] px-4 py-16 xs:px-5 md:py-24 lg:px-8">
        <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Three pillars</p>
        <h2 className="mt-5 font-editorial text-[clamp(2.5rem,6vw,3.75rem)] leading-[.92] tracking-[-.055em]">Equal focus. Real work.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Link key={pillar.name} href={pillar.href} className="flex min-h-[240px] flex-col border border-[#0d1a4a]/20 bg-white p-6 transition-colors hover:border-[#d9711b] xs:p-8">
              <h3 className="font-editorial text-2xl tracking-[-.03em]">{pillar.name}</h3>
              <p className="mt-4 flex-1 text-sm leading-6 text-[#5b554a]">{pillar.body}</p>
              <span className="mt-6 text-xs font-bold uppercase tracking-wider text-[#d9711b]">Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products & Services */}
      <section className="border-y border-[#0d1a4a]/20 bg-[#0d1a4a] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#eccb7c]">Products &amp; services</p>
            <h2 className="mt-5 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.92] tracking-[-.05em]">What we offer across our pillars.</h2>
          </div>
          <div className="self-end">
            <p className="text-[17px] leading-7 text-[#c8ccdb]">Agricultural products, distributed goods, and available property opportunities — curated and verified before publication.</p>
            <Link href="/products" className="mt-7 inline-flex border border-[#eccb7c] px-6 py-3 text-sm font-bold text-[#eccb7c] hover:bg-[#eccb7c] hover:text-[#0d1a4a]">View Products →</Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="mx-auto max-w-[1180px] px-4 py-16 xs:px-5 md:py-24 lg:px-8">
        <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Featured projects</p>
        <h2 className="mt-5 font-editorial text-4xl tracking-[-.04em]">Progress you can review.</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[#5b554a]">Updates published as work is verified — we do not fabricate proof points.</p>
        <Link href="/news" className="mt-6 inline-flex text-sm font-bold text-[#d9711b] hover:underline">News &amp; Updates →</Link>
      </section>

      {/* Gallery */}
      <section className="border-y border-[#0d1a4a]/20 bg-[#24399f] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] lg:grid lg:grid-cols-2 lg:gap-12">
          <h2 className="font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.92] tracking-[-.05em]">Real activity. Three pillars.</h2>
          <div className="self-end">
            <p className="leading-7 text-[#c9ccda]">Authentic photos and video from farms, warehouses, deliveries, markets, and properties — filterable by pillar.</p>
            <Link href="/gallery" className="mt-7 inline-flex bg-[#f6f2e8] px-6 py-3 text-sm font-bold text-[#24399f] hover:bg-[#eccb7c]">View Gallery →</Link>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section className="mx-auto max-w-[1180px] px-4 py-16 xs:px-5 md:py-24 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Membership</p>
            <h2 className="mt-5 font-editorial text-4xl tracking-[-.04em]">Join when applications are open.</h2>
            <p className="mt-6 leading-7 text-[#5b554a]">Registration is admin-controlled — apply through a campaign link when SINet opens a period for your role. The Student Network remains a separate, always-open pathway.</p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link href="/membership" className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white hover:bg-[#d9711b]">Join SINet</Link>
            <Link href="/student-network" className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-6 text-sm font-bold hover:border-[#d9711b]">Student Network</Link>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="border-t border-[#0d1a4a]/20 bg-[#eee6d0] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] text-center">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Partners</p>
          <h2 className="mt-5 font-editorial text-4xl">Strategic partnerships across our pillars.</h2>
          <Link href="/partners" className="mt-8 inline-flex text-sm font-bold text-[#0d1a4a] hover:text-[#d9711b]">Meet our partners →</Link>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="orange-grid bg-[#d9711b] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <h2 className="font-editorial text-[clamp(2.5rem,6vw,3.75rem)] leading-[.92] tracking-[-.05em]">Ready to connect?</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-[#fff4df]">Partner with us, explore products, or get in touch — we respond to every genuine inquiry.</p>
          </div>
          <Link href="/contact" className="inline-flex bg-[#f6f2e8] px-7 py-4 text-sm font-bold text-[#d9711b] hover:bg-[#0d1a4a] hover:text-white">Contact Us →</Link>
        </div>
      </section>
    </div>
  );
}
