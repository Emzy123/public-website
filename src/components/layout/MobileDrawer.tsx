'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
      <button className="absolute inset-0 cursor-default bg-[#0d1a4a]/45 backdrop-blur-xs" onClick={onClose} aria-label="Close menu" />
      <div className="relative h-full w-full max-w-sm overflow-auto bg-[#f6f2e8] px-6 py-7 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="font-editorial text-3xl font-semibold text-[#0d1a4a]">
            SINet<span className="text-[#d9711b]">.</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-[#0d1a4a] hover:bg-[#0d1a4a]/5"
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
              className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#0d1a4a] px-5 text-sm font-bold text-white transition-colors hover:bg-[#d9711b]"
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
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0d1a4a] px-5 text-sm font-bold text-white transition-colors hover:bg-[#d9711b]"
            >
              Get Notified (Cohort)
            </button>
          )}

          <Link
            href="/sign-in"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#0d1a4a]/25 bg-white px-5 text-sm font-semibold text-[#0d1a4a] transition-colors hover:border-[#0d1a4a]"
          >
            Sign in
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col border-t border-[#0d1a4a]/15" aria-label="Mobile primary navigation">
          {links.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="border-b border-[#0d1a4a]/15 py-2">
                  <button
                    type="button"
                    onClick={() => setCommunityExpanded((prev) => !prev)}
                    className="flex w-full min-h-[44px] items-center justify-between text-left text-base font-bold text-[#0d1a4a]"
                    aria-expanded={communityExpanded}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-slate-500">{communityExpanded ? '▲' : '▼'}</span>
                  </button>
                  {communityExpanded && (
                    <div className="ml-3 flex flex-col border-l-2 border-[#d9711b]/40 pl-3 pt-1 pb-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`flex min-h-[38px] items-center text-sm font-medium ${
                            currentPath === child.href ? 'font-bold text-[#d9711b]' : 'text-[#4f4b43] hover:text-[#0d1a4a]'
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
                className={`flex min-h-[48px] items-center border-b border-[#0d1a4a]/15 text-base ${
                  active ? 'font-bold text-[#d9711b]' : 'font-medium text-[#0d1a4a]'
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
