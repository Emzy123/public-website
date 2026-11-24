'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MobileDrawer } from './MobileDrawer';
import { ApplyNotifyModal } from './ApplyNotifyModal';
import { getPrimaryNav, type PrimaryNavItem } from '@/lib/site-config';

import { Logo } from '@/components/brand/Logo';
import { cleanFullName } from '@/lib/members/memberId';

const PRIMARY_NAV = getPrimaryNav();

const ALLOWED_HEADER_LOGOS = new Set([
  '/brand/sinet-lockup-compact.png',
  '/brand/sinet-lockup-compact@2x.png',
  '/brand/sinet-lockup.png',
  '/brand/sinet-lockup@2x.png',
  '/brand/sinet-mark.png',
  '/brand/sinet-mark@2x.png',
]);

const ALLOWED_FULL_HEADER_LOGOS = new Set([
  '/brand/sinet-lockup.png',
  '/brand/sinet-lockup@2x.png',
]);

function resolveHeaderLogoVariant(url?: string): 'compact' | 'full' {
  if (!url || !ALLOWED_HEADER_LOGOS.has(url.trim())) {
    return 'compact';
  }
  const clean = url.trim();
  if (ALLOWED_FULL_HEADER_LOGOS.has(clean)) {
    return 'full';
  }
  return 'compact';
}

type HeaderProps = {
  whatsappUrl?: string;
  stackOffset?: boolean;
  logoUrl?: string;
};

export function Header({ stackOffset = false, logoUrl }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignUrl, setCampaignUrl] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<{ fullName: string | null; email: string } | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const headerLogoVariant = resolveHeaderLogoVariant(logoUrl);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch active application status and authenticated session
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

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (data.authenticated && data.user) {
          setUserSession({
            fullName: data.user.profile?.fullName || null,
            email: data.user.email,
          });
        } else {
          setUserSession(null);
        }
      })
      .catch(() => {
        if (mounted) setUserSession(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUserSession(null);
    setIsAccountDropdownOpen(false);
    router.push('/sign-in');
    router.refresh();
  };

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCommunityDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCommunityDropdownOpen(false);
        setIsAccountDropdownOpen(false);
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
    setIsAccountDropdownOpen(false);
  }, [pathname]);

  const displayName = userSession
    ? cleanFullName(userSession.fullName, userSession.email) || 'Account'
    : null;

  return (
    <>
      <header
        className={`sticky z-40 border-b border-white/10 transition-all duration-300 ${
          stackOffset ? 'top-10' : 'top-0'
        } ${isScrolled ? 'bg-[#0A0A0F]/95 backdrop-blur-md shadow-[0_5px_20px_rgba(0,0,0,0.4)]' : 'bg-[#0A0A0F]'}`}
      >
        <div className="mx-auto flex h-[77px] max-w-[1220px] items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center" aria-label="SINet home">
            <Logo
              variant={headerLogoVariant}
              height={40}
              priority={true}
              className="h-8 w-auto sm:h-10"
            />
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
                          ? 'font-semibold text-[#E0A92E]'
                          : 'text-[#F6F2E8]/85 hover:text-[#E0A92E]'
                      }`}
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          isCommunityDropdownOpen ? 'rotate-180 text-[#E0A92E]' : 'text-[#F6F2E8]/70'
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
                        className="absolute left-0 top-full z-50 w-52 rounded-xl border border-white/15 bg-[#0A0A0F] p-2 shadow-xl ring-1 ring-black/20"
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
                                  ? 'bg-white/10 text-[#E0A92E]'
                                  : 'text-[#F6F2E8]/85 hover:bg-white/10 hover:text-[#E0A92E]'
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
                    active ? 'font-semibold text-[#E0A92E]' : 'text-[#F6F2E8]/85 hover:text-[#E0A92E]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 xl:flex">
            {userSession ? (
              <div ref={accountDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                  aria-expanded={isAccountDropdownOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#F6F2E8] transition-colors hover:border-[#E0A92E] hover:text-[#E0A92E] hover:bg-white/5"
                >
                  <span>{displayName}</span>
                  <svg
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isAccountDropdownOpen ? 'rotate-180 text-[#E0A92E]' : 'text-[#F6F2E8]/70'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isAccountDropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Account navigation"
                    className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-white/15 bg-[#0A0A0F] p-1.5 shadow-xl ring-1 ring-black/20"
                  >
                    <Link
                      href="/portal"
                      role="menuitem"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="block rounded-lg px-3.5 py-2 text-xs font-semibold text-[#F6F2E8]/85 hover:bg-white/10 hover:text-[#E0A92E]"
                    >
                      Portal
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full text-left rounded-lg px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-white/10 hover:text-rose-200"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#F6F2E8] transition-colors hover:border-[#E0A92E] hover:text-[#E0A92E] hover:bg-white/5"
                >
                  Sign in
                </Link>

                {isCampaignOpen ? (
                  <Link
                    href={campaignUrl || '/join'}
                    className="inline-flex rounded-lg bg-[#143DB1] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2153D2]"
                  >
                    Apply Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsNotifyModalOpen(true)}
                    className="inline-flex rounded-lg bg-[#143DB1] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2153D2]"
                  >
                    Get Notified
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-[#F6F2E8] hover:bg-white/5 xl:hidden"
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
        userSession={userSession}
        onLogout={handleLogout}
      />

      <ApplyNotifyModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
      />
    </>
  );
}
