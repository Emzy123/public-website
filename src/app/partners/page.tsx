import Link from 'next/link';

export const metadata = {
  title: 'Partners | SINet',
  description: 'Strategic partnerships across agriculture, trade & goods distribution, and real estate.',
};

const PARTNER_AREAS = [
  { pillar: 'Real Estate', body: 'Developer partnerships and property marketing collaborators.' },
  { pillar: 'Trade & Goods Distribution', body: 'Distribution partners, logistics providers, and wholesale relationships.' },
  { pillar: 'Agriculture', body: 'Farm, aggregation, and processing partners in the agriculture pillar.' },
];

export default function PartnersPage() {
  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Partners</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">
            Built with trusted partners.
          </h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">
            SINet works with operators and institutions across our three pillars. Public partner profiles are added
            once relationships are confirmed.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {PARTNER_AREAS.map((area) => (
            <div key={area.pillar} className="border border-[#0d1a4a]/20 bg-white p-6">
              <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">{area.pillar}</p>
              <p className="mt-3 text-sm leading-6 text-[#5b554a]">{area.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 border border-[#0d1a4a]/20 bg-[#eee6d0] p-10 text-center">
          <p className="font-editorial text-2xl text-[#0d1a4a]">Interested in partnering?</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5b554a]">
            Tell us about your organisation and how you want to collaborate across our pillars.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9711b]"
          >
            Partner with us
          </Link>
        </div>
      </section>
    </div>
  );
}
