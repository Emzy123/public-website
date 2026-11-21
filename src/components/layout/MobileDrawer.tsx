'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import type { PrimaryNavItem } from '@/lib/site-config';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links: PrimaryNavItem[];
  currentPath: string;
  isCampaignOpen?: boolean;
  campaignUrl?: string;
  onOpenNotify?: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  links,
  currentPath,
  isCampaignOpen,
  campaignUrl,
  onOpenNotify,
}: MobileDrawerProps) {
  const [communityExpanded, setCommunityExpanded] = useState(true);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Site navigation">
      <button className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-xs" onClick={onClose} aria-label="Close menu" />
      <div className="relative h-full w-full max-w-sm overflow-auto bg-[#0A0A0F] text-[#F6F2E8] px-6 py-7 shadow-2xl border-l border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center" aria-label="SINet home">
            <Logo variant="compact" height={32} className="h-8 w-auto" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-[#F6F2E8] hover:bg-white/10"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Primary CTA Buttons */}
        <div className="mb-6 flex flex-col gap-2.5">
          {isCampaignOpen ? (
            <Link
              href={campaignUrl || '/join'}
              onClick={onClose}
              className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#143DB1] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2153D2]"
            >
              Apply Now →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNotify?.();
              }}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#143DB1] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2153D2]"
            >
              Get Notified (Cohort)
            </button>
          )}

          <Link
            href="/sign-in"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 text-sm font-semibold text-[#F6F2E8] transition-colors hover:border-[#E0A92E] hover:text-[#E0A92E] hover:bg-white/5"
          >
            Sign in
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col border-t border-white/10" aria-label="Mobile primary navigation">
          {links.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="border-b border-white/10 py-2">
                  <button
                    type="button"
                    onClick={() => setCommunityExpanded((prev) => !prev)}
                    className="flex w-full min-h-[44px] items-center justify-between text-left text-base font-bold text-[#F6F2E8]"
                    aria-expanded={communityExpanded}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-[#F6F2E8]/60">{communityExpanded ? '▲' : '▼'}</span>
                  </button>
                  {communityExpanded && (
                    <div className="ml-3 flex flex-col border-l-2 border-[#E0A92E]/40 pl-3 pt-1 pb-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`flex min-h-[38px] items-center text-sm font-medium ${
                            currentPath === child.href ? 'font-bold text-[#E0A92E]' : 'text-[#F6F2E8]/75 hover:text-[#E0A92E]'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const active = currentPath === item.href;
            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                onClick={onClose}
                className={`flex min-h-[48px] items-center border-b border-white/10 text-base ${
                  active ? 'font-bold text-[#E0A92E]' : 'font-medium text-[#F6F2E8] hover:text-[#E0A92E]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
