'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { SubmissionCounts } from '@admin/lib/submissions';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  end?: boolean;
};

const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        end: true,
        icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
      },
    ],
  },
  {
    label: 'Applications',
    items: [
      {
        href: '/admin/links',
        label: 'Link Management',
        icon: <Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />,
      },
      {
        href: '/admin/applications',
        label: 'All Applications',
        icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      },
    ],
  },
  {
    label: 'Members',
    items: [
      {
        href: '/admin/submissions',
        label: 'Form Submissions',
        icon: <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        href: '/admin/team',
        label: 'Leadership Team',
        icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />,
      },
      {
        href: '/admin/content/home',
        label: 'Homepage',
        icon: <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
      },
      {
        href: '/admin/content/site-settings',
        label: 'Settings',
        icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
      },
    ],
  },
];

function SidebarContent({
  pathname,
  unread,
  onClose,
  logout,
}: {
  pathname: string;
  unread: number;
  onClose?: () => void;
  logout: () => void;
}) {
  const isActive = (item: NavItem) => {
    if (item.end) return pathname === item.href;
    const base = item.href.split('?')[0];
    return pathname.startsWith(base);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#d9a23c]">
          <span className="font-bold text-[#0d1a4a] text-sm">S</span>
        </div>
        <div>
          <Link href="/admin" onClick={onClose} className="block font-semibold text-white leading-none text-[15px]">
            SINet Admin
          </Link>
          <p className="text-[10px] text-[#d9a23c] uppercase tracking-widest mt-0.5">Staff console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#d9a23c]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item);
              const showBadge = item.href === '/admin/submissions' && unread > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all mb-0.5 ${
                    active
                      ? 'bg-[#d9a23c]/15 text-[#d9a23c] font-medium'
                      : 'text-white hover:bg-white/[.06] hover:text-[#d9a23c]'
                  }`}
                >
                  <span className={`shrink-0 ${active ? 'text-[#d9a23c]' : 'text-white/70'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="shrink-0 rounded-full bg-[#d9a23c] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0d1a4a]">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9a23c] font-bold text-xs text-[#0d1a4a]">
            FB
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Favour Benjamin</p>
            <p className="truncate text-xs text-white/40">Community Operations</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 text-xs text-[#d9a23c] hover:text-white transition-colors"
        >
          <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/admin/submissions?limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.counts as SubmissionCounts | undefined;
        if (c) setUnread(c.contacts.unread + c.academy.unread);
      })
      .catch(() => setUnread(0));
  }, [pathname]);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => setCsrfToken(r.headers.get('x-csrf-token') ?? ''))
      .catch(() => setCsrfToken(''));
  }, []);

  const logout = async () => {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f6f2e8] text-[#0d1a4a] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0d1a4a]">
        <SidebarContent pathname={pathname} unread={unread} logout={logout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="relative flex w-64 flex-col bg-[#0d1a4a] shadow-2xl">
            <SidebarContent
              pathname={pathname}
              unread={unread}
              onClose={() => setDrawerOpen(false)}
              logout={logout}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between gap-4 border-b border-[#e4dcc9] bg-white/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-[#0d1a4a] hover:bg-[#f0e9d9] lg:hidden"
              aria-label="Open menu"
            >
              <Icon d="M4 6h16M4 12h16M4 18h16" size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold leading-none text-[#0d1a4a]">{title}</h1>
              {description && <p className="mt-0.5 text-xs text-[#7b7263]">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9a23c] font-bold text-xs text-[#0d1a4a]">
                FB
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-7 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Shared action buttons ── */
export function SaveButton({
  onClick,
  saving,
  saved,
  label = 'Save Draft',
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-lg border border-[#d9a23c] bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] transition-opacity disabled:opacity-50 hover:bg-[#c8921e]"
    >
      {saving ? 'Saving…' : saved ? '✓ Saved' : label}
    </button>
  );
}

export function PublishButton({
  onClick,
  publishing,
  published,
  disabled,
}: {
  onClick: () => void;
  publishing: boolean;
  published: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={publishing || disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[#0d1a4a] bg-[#0d1a4a] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-[#1a2d66]"
    >
      {publishing ? 'Publishing…' : published ? '✓ Published' : 'Publish'}
    </button>
  );
}

export function PreviewButton({
  onClick,
  previewing,
  disabled,
}: {
  onClick: () => void;
  previewing: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={previewing || disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[#d9d1bf] bg-white px-4 py-2 text-sm font-semibold text-[#0d1a4a] transition-colors disabled:opacity-50 hover:border-[#0d1a4a]"
    >
      {previewing ? 'Opening…' : 'Preview'}
    </button>
  );
}

export function AdminCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#e4dcc9] bg-white p-6 ${className}`}>
      {title && <h2 className="mb-4 text-base font-semibold text-[#0d1a4a]">{title}</h2>}
      {children}
    </div>
  );
}
