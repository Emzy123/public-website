import Link from 'next/link';

const SECTORS = [
  { number: '01', state: 'LEADING FOCUS', title: 'Real Estate & Property', body: 'SINet is currently building commercial experience through property marketing across states and developer relationships. Specific listings and project partners will only be published once verified.', color: 'bg-[#0d1a4a] text-[#f6f2e8]' },
  { number: '02', state: 'SECONDARY', title: 'Agriculture', body: 'Agricultural activity remains part of the broader enterprise mix: practical, selective, and connected to community and cash-flow opportunities.', color: 'bg-[#eee6d0] text-[#0d1a4a]' },
  { number: '03', state: 'EXPLORATORY', title: 'Manufacturing', body: 'Manufacturing is a future direction. The work today is to learn, prepare, and build the partnerships and capability a serious entry will require.', color: 'bg-[#24399f] text-[#f6f2e8]' },
];

export const metadata = { title: 'What We Do | SINet', description: 'SINet focuses on real estate and property, supported by agriculture and future manufacturing exploration.' };

export default function SectorsPage() {
  return <div className="bg-[#f6f2e8] text-[#0d1a4a]">
    <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[1180px]"><p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">What we do</p><h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,6rem)] leading-[.86] tracking-[-.06em]">Enterprise with a point of view.</h1><p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">We lead with property. We support the work with agriculture. We design for the possibility of manufacturing when the foundations are ready.</p></div></section>
    <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">{SECTORS.map((sector) => <article key={sector.number} className={`grid min-h-[260px] border border-[#0d1a4a]/20 p-5 xs:p-7 sm:p-10 md:min-h-[340px] ${sector.color} ${sector.number !== '01' ? 'border-t-0' : ''} lg:grid-cols-[.6fr_1.4fr] lg:gap-8`}><p className="font-data text-[11px] uppercase tracking-[.16em] opacity-75">{sector.number} — {sector.state}</p><div><h2 className="font-editorial text-5xl leading-[.9] tracking-[-.05em]">{sector.title}</h2><p className="mt-8 max-w-xl text-[17px] leading-7 opacity-80">{sector.body}</p></div></article>)}</section>
    <section className="bg-[#0d1a4a] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8"><div className="mx-auto grid max-w-[1180px] gap-8 md:gap-10 lg:grid-cols-2"><div><p className="font-data text-[11px] uppercase tracking-[.16em] text-[#eccb7c]">A careful public record</p><h2 className="mt-5 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.9] tracking-[-.05em]">Updates when there is something real to report.</h2></div><div className="self-end"><p className="leading-7 text-[#c9ccda]">We will not manufacture proof points. As projects, properties, partnerships, and reports are verified for public release, they will be added to the SINet Reports & Transparency area.</p><Link href="/reports" className="mt-7 inline-flex border border-[#eccb7c] px-6 py-3 text-sm font-bold text-[#eccb7c] hover:bg-[#eccb7c] hover:text-[#0d1a4a]">View Reports & Transparency →</Link></div></div></section>
  </div>;
}
