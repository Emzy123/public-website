import Link from 'next/link';
import type { SiteSettings } from '@admin/types/content';
import { CONTACT_EMAIL, FEATURE_FLAGS, OFFICIAL_LEGAL_NAME } from '@/lib/site-config';
import { SocialLinksBar } from '@/components/common/SocialIcons';
import { Logo } from '@/components/brand/Logo';

const ALLOWED_FOOTER_LOGOS = new Set([
  '/brand/sinet-lockup.png',
  '/brand/sinet-lockup@2x.png',
  '/brand/sinet-lockup-compact.png',
  '/brand/sinet-lockup-compact@2x.png',
  '/brand/sinet-mark.png',
  '/brand/sinet-mark@2x.png',
]);

function resolveFooterLogoVariant(url?: string): 'full' | 'compact' | 'mark' {
  if (!url || !ALLOWED_FOOTER_LOGOS.has(url.trim())) {
    return 'full';
  }
  const clean = url.trim();
  if (clean.includes('sinet-mark')) return 'mark';
  if (clean.includes('sinet-lockup-compact')) return 'compact';
  return 'full';
}

type FooterProps = { settings?: SiteSettings };

export function Footer({ settings }: FooterProps) {
  const contact = settings?.contact;
  const social = settings?.social;
  const rawBrandCopy =
    settings?.footer?.brandCopy?.trim() ||
    "Building Africa's Future Systems. A business ecosystem built on agriculture, trade & distribution, and real estate — with community at the centre.";
  const brandCopy = rawBrandCopy.replace("Build Africa's future.", "Building Africa's Future Systems.");
  const displayEmail = contact?.email || CONTACT_EMAIL;

  const exploreLinks = [
    ['What We Do', '/sectors'],
    ...(FEATURE_FLAGS.showProducts ? [['Products', '/products']] : []),
    ['Gallery', '/gallery'],
    ...(FEATURE_FLAGS.showNews ? [['News', '/news']] : []),
  ];

  const communityLinks = [
    ['About & Leadership', '/about'],
    ['Campus Chapters', '/chapters'],
    ['Student Network', '/student-network'],
    ['Academy', '/academy'],
    ['Membership', '/membership'],
  ];

  const membersLinks = [
    ['Sign in', '/sign-in'],
    ['Verify credential', '/verify'],
  ];

  const legalLinks = [
    ['Privacy Policy', '/privacy'],
    ['Terms of Service', '/terms'],
  ];

  const columns = [
    { title: 'Explore', links: exploreLinks },
    { title: 'Community', links: communityLinks },
    { title: 'Members', links: membersLinks },
    { title: 'Legal', links: legalLinks },
  ];

  const customSocial = {
    x: social?.x,
    linkedin: social?.linkedin,
    facebook: social?.facebook,
    instagram: social?.instagram,
    whatsapp: social?.whatsapp,
  };

  return (
    <footer id="footer" className="bg-[#0A0A0F] text-[#f6f2e8]">
      <div className="border-b border-white/15 px-4 py-8 xs:px-5 md:py-10 lg:px-8">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between">
          <Link href="/" aria-label="SINet home">
            <Logo
              variant={resolveFooterLogoVariant(settings?.footerLogoUrl)}
              width={200}
              className="h-auto w-[200px] object-contain opacity-95"
            />
          </Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-10 xs:gap-10 xs:px-5 xs:py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.35fr_repeat(4,1fr)] lg:px-8">
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
          <p>© {new Date().getFullYear()} {OFFICIAL_LEGAL_NAME} (SINet). All rights reserved.</p>
          <p>Kogi State, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
