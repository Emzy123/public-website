import Image from 'next/image';
import Link from 'next/link';
import type { SiteSettings } from '@admin/types/content';

type FooterProps = { settings?: SiteSettings };

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      ['What We Do', '/sectors'],
      ['Products', '/products'],
      ['Gallery', '/gallery'],
      ['News & Updates', '/news'],
    ],
  },
  {
    title: 'Community',
    links: [
      ['About & Leadership', '/about'],
      ['Membership', '/membership'],
      ['Student Network', '/student-network'],
      ['Partners', '/partners'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
    ],
  },
];

export function Footer({ settings }: FooterProps) {
  const contact = settings?.contact;
  const social = settings?.social;
  const brandCopy =
    settings?.footer?.brandCopy?.trim() ||
    'A business ecosystem built on agriculture, trade & distribution, and real estate — with community at the centre.';
  const footerLogo = settings?.footerLogoUrl?.trim();

  const socialLinks = [
    social?.instagram && { label: 'Instagram', href: social.instagram },
    social?.linkedin && { label: 'LinkedIn', href: social.linkedin },
    social?.x && { label: 'X', href: social.x },
    social?.facebook && { label: 'Facebook', href: social.facebook },
    social?.whatsapp && { label: 'WhatsApp', href: social.whatsapp },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="bg-[#0d1a4a] text-[#f6f2e8]">
      <div className="border-b border-white/15 px-4 py-10 xs:px-5 md:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="font-editorial text-[clamp(3.5rem,14vw,11rem)] leading-[.75] tracking-[-.07em]">
            SINet<span className="text-[#eccb7c]">.</span>
          </div>
          {footerLogo && (
            <Image src={footerLogo} alt="SINet" width={120} height={40} className="h-10 w-auto object-contain opacity-90" />
          )}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-10 xs:gap-10 xs:px-5 xs:py-12 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)] lg:px-8">
        <div className="max-w-[285px] text-sm leading-6 text-[#c7cad9]">
          <p>{brandCopy}</p>
          {contact?.address && (
            <p className="mt-5 font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c]">{contact.address}</p>
          )}
          {contact?.email && (
            <a href={`mailto:${contact.email}`} className="mt-3 block text-sm text-[#eccb7c] hover:underline">
              {contact.email}
            </a>
          )}
          {socialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-data text-[11px] uppercase tracking-[.12em] text-[#a9aec5] hover:text-[#eccb7c]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 font-data text-[11px] uppercase tracking-[.14em] text-[#eccb7c]">{column.title}</h2>
            <ul className="space-y-1 text-sm text-[#d8d9df]">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#eccb7c]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15 px-4 py-5 text-xs text-[#a9aec5] xs:px-5 lg:px-8">
        <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} SINet. All rights reserved.</p>
          <p>Kogi State, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
