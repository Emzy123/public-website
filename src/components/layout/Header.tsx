'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileDrawer } from './MobileDrawer';

const PRIMARY_NAV = [
  { label: 'About', href: '/about' },
  { label: 'What We Do', href: '/sectors' },
  { label: 'Products', href: '/products' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'News', href: '/news' },
  { label: 'Partners', href: '/partners' },
  { label: 'Membership', href: '/membership' },
  { label: 'Student Network', href: '/student-network' },
  { label: 'Contact', href: '/contact' },
];

type HeaderProps = { whatsappUrl?: string; stackOffset?: boolean; logoUrl?: string };

export function Header({ stackOffset = false, logoUrl }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const brandLogo = logoUrl?.trim() || '/images/favicon.svg';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky z-40 border-b border-[#0d1a4a]/15 transition-all duration-300 ${
          stackOffset ? 'top-10' : 'top-0'
        } ${isScrolled ? 'bg-[#f6f2e8]/95 backdrop-blur-md shadow-[0_5px_20px_rgba(13,26,74,.06)]' : 'bg-[#f6f2e8]'}`}
      >
        <div className="mx-auto flex h-[77px] max-w-[1220px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="SINet home">
            <Image
              src={brandLogo}
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 object-contain transition-transform group-hover:-rotate-6"
              priority
            />
            <span className="font-editorial text-[26px] font-semibold tracking-[-.04em] text-[#0d1a4a]">
              SINet<span className="text-[#d9711b]">.</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
            {PRIMARY_NAV.map((link) => {
              const active =
                pathname === link.href || (link.href.includes('#') && pathname === link.href.split('#')[0]);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3 py-2 text-[13px] transition-colors ${
                    active ? 'font-semibold text-[#0d1a4a]' : 'text-[#4f4b43] hover:text-[#d9711b]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden xl:block">
            <Link
              href="/membership"
              className="inline-flex bg-[#0d1a4a] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#d9711b]"
            >
              Join SINet
            </Link>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center border border-[#0d1a4a]/20 text-[#0d1a4a] xl:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.8} d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={PRIMARY_NAV}
        currentPath={pathname}
      />
    </>
  );
}
