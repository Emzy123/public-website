import Link from 'next/link';
import type { SiteSettings } from '@admin/types/content';

type FooterProps = { settings?: SiteSettings };
const COLUMNS = [
  { title: 'Platform', links: [['Investment Plans', '/investment-plans'], ['What We Do', '/sectors'], ['How It Works', '/investment-plans#how-it-works']] },
  { title: 'Community', links: [['About & Leadership', '/about'], ['Student Network', '/student-network'], ['Get Involved', '/get-involved'], ['Contact', '/contact']] },
  { title: 'Legal', links: [['Reports & Transparency', '/reports'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] },
];

export function Footer({ settings }: FooterProps) {
  const contact = settings?.contact;
  return <footer className="bg-[#0d1a4a] text-[#f6f2e8]">
    <div className="border-b border-white/15 px-4 py-10 xs:px-5 md:py-14 lg:px-8 lg:py-20"><div className="mx-auto max-w-[1380px]"><div className="font-editorial text-[clamp(3.5rem,14vw,11rem)] leading-[.75] tracking-[-.07em]">SINet<span className="text-[#eccb7c]">.</span></div></div></div>
    <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-10 xs:gap-10 xs:px-5 xs:py-12 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)] lg:px-8">
      <div className="max-w-[285px] text-sm leading-6 text-[#c7cad9]">A pan-African community creating value through property, enterprise, and participation — with a dedicated home for student investors.{contact?.address && <p className="mt-5 font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c]">{contact.address}</p>}</div>
      {COLUMNS.map((column) => <div key={column.title}><h2 className="mb-4 font-data text-[11px] uppercase tracking-[.14em] text-[#eccb7c]">{column.title}</h2><ul className="space-y-1 text-sm text-[#d8d9df]">{column.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#eccb7c]">{label}</Link></li>)}</ul></div>)}
    </div>
    <div className="border-t border-white/15 px-4 py-5 text-xs text-[#a9aec5] xs:px-5 lg:px-8"><div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-3 sm:flex-row"><p>© {new Date().getFullYear()} SINet. All rights reserved.</p><p>Kogi State, Nigeria</p></div></div>
  </footer>;
}
