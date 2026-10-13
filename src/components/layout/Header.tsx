'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileDrawer } from './MobileDrawer';
import { ApplyNotifyModal } from './ApplyNotifyModal';
import { getPrimaryNav, type PrimaryNavItem } from '@/lib/site-config';

const PRIMARY_NAV = getPrimaryNav();
const DEFAULT_LOGO = '/images/logo-icon.svg';

type HeaderProps = {
  whatsappUrl?: string;
  stackOffset?: boolean;
  logoUrl?: string;
};

function isWordmark(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('sinet-logo') || lower.includes('logo-primary') || lower.includes('wordmark');
}

export function Header({ stackOffset = false, logoUrl }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignUrl, setCampaignUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const brandLogo = logoFailed ? DEFAULT_LOGO : logoUrl?.trim() || DEFAULT_LOGO;
  const wordmark = isWordmark(brandLogo);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch active application status
  useEffect(() => {
    let mounted = true;
    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setIsCampaignOpen(Boolean(data.active));
        if (data.url) setCampaignUrl(data.url);
      })
      .catch(() => {
        // Fallback: assume closed if error
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCommunityDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCommunityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsCommunityDropdownOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky z-40 border-b border-[#0d1a4a]/15 transition-all duration-300 ${
          stackOffset ? 'top-10' : 'top-0'
        } ${isScrolled ? 'bg-[#f6f2e8]/95 backdrop-blur-md shadow-[0_5px_20px_rgba(13,26,74,.06)]' : 'bg-[#f6f2e8]'}`}
      >
        <div className="mx-auto flex h-[77px] max-w-[1220px] items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label="SINet home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogo}
              alt=""
              width={wordmark ? 160 : 36}
              height={wordmark ? 48 : 36}
              className={
                wordmark
                  ? 'h-9 w-auto max-w-[160px] object-contain transition-transform group-hover:-rotate-1'
                  : 'h-9 w-9 object-contain transition-transform group-hover:-rotate-6'
              }
              onError={() => setLogoFailed(true)}
            />
            {!wordmark && (
              <span className="font-editorial text-[26px] font-semibold tracking-[-.04em] text-[#0d1a4a]">
                SINet<span className="text-[#d9711b]">.</span>
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item: PrimaryNavItem) => {
              if (item.children) {
                const isChildActive = item.children.some((c) => pathname.startsWith(c.href));
                return (
                  <div
                    key={item.label}
                    ref={dropdownRef}
                    className="relative"
                    onMouseEnter={() => setIsCommunityDropdownOpen(true)}
                    onMouseLeave={() => setIsCommunityDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setIsCommunityDropdownOpen((prev) => !prev)}
                      aria-expanded={isCommunityDropdownOpen}
                      aria-haspopup="true"
                      className={`inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors ${
                        isChildActive || isCommunityDropdownOpen
                          ? 'font-semibold text-[#0d1a4a]'
                          : 'text-[#4f4b43] hover:text-[#d9711b]'
                      }`}
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          isCommunityDropdownOpen ? 'rotate-180 text-[#d9711b]' : 'text-[#4f4b43]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCommunityDropdownOpen && (
                      <div
                        role="menu"
                        aria-label="Community navigation"
                        className="absolute left-0 top-full z-50 w-52 rounded-xl border border-[#0d1a4a]/15 bg-white p-2 shadow-xl ring-1 ring-black/5"
                      >
                        {item.children.map((child) => {
                          const active = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              role="menuitem"
                              onClick={() => setIsCommunityDropdownOpen(false)}
                              className={`block rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                                active
                                  ? 'bg-[#d9711b]/10 text-[#d9711b]'
                                  : 'text-[#0d1a4a] hover:bg-[#f6f2e8] hover:text-[#d9711b]'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href || '#'}
                  className={`px-3 py-2 text-[13px] transition-colors ${
                    active ? 'font-semibold text-[#0d1a4a]' : 'text-[#4f4b43] hover:text-[#d9711b]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d1a4a]/25 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#0d1a4a] transition-colors hover:border-[#0d1a4a] hover:bg-[#0d1a4a]/5"
            >
              Sign in
            </Link>

            {isCampaignOpen ? (
              <Link
                href={campaignUrl || '/join'}
                className="inline-flex rounded-lg bg-[#0d1a4a] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d9711b]"
              >
                Apply Now
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsNotifyModalOpen(true)}
                className="inline-flex rounded-lg bg-[#0d1a4a] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#d9711b]"
              >
                Get Notified
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0d1a4a]/20 text-[#0d1a4a] xl:hidden"
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
        isCampaignOpen={isCampaignOpen}
        campaignUrl={campaignUrl || undefined}
        onOpenNotify={() => setIsNotifyModalOpen(true)}
      />

      <ApplyNotifyModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
      />
    </>
  );
}
