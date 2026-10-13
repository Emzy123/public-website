import Link from 'next/link';
import type { SiteSettings } from '@admin/types/content';
import { CONTACT_EMAIL, FEATURE_FLAGS } from '@/lib/site-config';
import { SocialLinksBar } from '@/components/common/SocialIcons';

type FooterProps = { settings?: SiteSettings };

export function Footer({ settings }: FooterProps) {
  const contact = settings?.contact;
  const social = settings?.social;
  const brandCopy =
    settings?.footer?.brandCopy?.trim() ||
    'A business ecosystem built on agriculture, trade & distribution, and real estate — with community at the centre.';
  const footerLogo = settings?.footerLogoUrl?.trim() || '/images/sinet-logo.svg';
  const displayEmail = contact?.email || CONTACT_EMAIL;

  const exploreLinks = [
    ['What We Do', '/sectors'],
    ...(FEATURE_FLAGS.showProducts ? [['Products', '/products']] : []),
    ['Gallery', '/gallery'],
    ...(FEATURE_FLAGS.showNews ? [['News & Updates', '/news']] : []),
  ];

  const communityLinks = [
    ['About & Leadership', '/about'],
    ['Membership', '/membership'],
    ['Join SINet', '/join'],
    ['Campus Chapters', '/chapters'],
    ['Student Member Portal', '/portal'],
    ['Verify Credential', '/verify'],
    ['Student Network', '/student-network'],
    ...(FEATURE_FLAGS.showPartners ? [['Partners', '/partners']] : []),
    ['Contact', '/contact'],
  ];

  const columns = [
    { title: 'Explore', links: exploreLinks },
    { title: 'Community', links: communityLinks },
    {
      title: 'Legal',
      links: [
        ['Privacy Policy', '/privacy'],
        ['Terms of Service', '/terms'],
      ],
    },
  ];

  const customSocial = {
    x: social?.x,
    linkedin: social?.linkedin,
    facebook: social?.facebook,
    instagram: social?.instagram,
    whatsapp: social?.whatsapp,
  };

  return (
    <footer className="bg-[#0d1a4a] text-[#f6f2e8]">
      <div className="border-b border-white/15 px-4 py-10 xs:px-5 md:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="font-editorial text-[clamp(3.5rem,14vw,11rem)] leading-[.75] tracking-[-.07em]">
            SINet<span className="text-[#eccb7c]">.</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={footerLogo}
            alt="SINet"
            width={220}
            height={70}
            className="h-12 w-auto max-w-[220px] object-contain opacity-95 sm:h-14"
          />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-10 xs:gap-10 xs:px-5 xs:py-12 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)] lg:px-8">
        <div className="max-w-[285px] text-sm leading-6 text-[#c7cad9]">
          <p>{brandCopy}</p>
          {contact?.address && (
            <p className="mt-5 font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c]">{contact.address}</p>
          )}
          <a href={`mailto:${displayEmail}`} className="mt-3 block text-sm text-[#eccb7c] hover:underline">
            {displayEmail}
          </a>
          <div className="mt-5">
            <SocialLinksBar
              className="flex flex-wrap gap-2.5"
              linkClassName="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#d8d9df] hover:bg-[#eccb7c] hover:text-[#0d1a4a] transition-colors"
              customLinks={customSocial}
            />
          </div>
        </div>
        {columns.map((column) => (
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
