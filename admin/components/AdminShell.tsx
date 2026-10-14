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
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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
    label: 'Admissions & Funnels',
    items: [
      {
        href: '/admin/applications',
        label: 'Applications',
        icon: (
          <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        ),
      },
      {
        href: '/admin/links',
        label: 'Campaign Links',
        icon: (
          <Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        ),
      },
      {
        href: '/admin/submissions',
        label: 'Form Inquiries',
        icon: (
          <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        ),
      },
    ],
  },
  {
    label: 'Publishing',
    items: [
      {
        href: '/admin/posts',
        label: 'News & Updates',
        icon: (
          <Icon d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
        ),
      },
      {
        href: '/admin/content/adverts',
        label: 'Spotlight & Flyers',
        icon: (
          <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        ),
      },
      {
        href: '/admin/content/gallery',
        label: 'Media Gallery',
        icon: (
          <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        ),
      },
      {
        href: '/admin/team',
        label: 'Leadership Team',
        icon: (
          <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />
        ),
      },
    ],
  },
  {
    label: 'Operations & Governance',
    items: [
      {
        href: '/chapters',
        label: 'Campus Chapters',
        icon: (
          <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        ),
      },
      {
        href: '/admin/audit',
        label: 'Security Audit Log',
        icon: <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      },
      {
        href: '/admin/content/site-settings',
        label: 'System Settings',
        icon: (
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
      },
    ],
  },
];

function SidebarContent({
  pathname,
  unread,
  pendingApps,
  onClose,
  logout,
}: {
  pathname: string;
  unread: number;
  pendingApps: number;
  onClose?: () => void;
  logout: () => void;
}) {
  const isActive = (item: NavItem) => {
    if (item.end) return pathname === item.href;
    const base = item.href.split('?')[0];
    return pathname.startsWith(base);
  };

  return (
    <div className="flex h-full flex-col bg-[#0b1222] text-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-md shadow-amber-500/20 font-black text-sm text-[#071026]">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-sm">SINet</span>
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 ring-1 ring-blue-500/30">
                PROD
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">Executive Console</p>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const isSubmissions = item.href === '/admin/submissions';
                const isApplications = item.href === '/admin/applications';
                const badgeCount = isSubmissions ? unread : isApplications ? pendingApps : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`transition-colors ${
                          active
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {badgeCount > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isApplications
                            ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Mini Performance Widget (Matching Reference Design) */}
        <div className="mt-4 rounded-xl bg-slate-900/80 p-3 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
              Admissions Pace
            </span>
            <span className="text-amber-400 text-[10px]">Active</span>
          </div>
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>Review Queue</span>
                <span className="text-slate-300 font-semibold">{pendingApps} pending</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(20, 100 - pendingApps * 4))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>Campus Scopes</span>
                <span className="text-emerald-400 font-semibold">6 chapters</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer / Profile Card */}
      <div className="border-t border-slate-800/80 p-3.5 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs ring-1 ring-blue-500/30">
              AD
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">Administrator</p>
              <p className="truncate text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Active Session
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <Icon
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              size={15}
            />
          </button>
        </div>
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
  const [pendingApps, setPendingApps] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // 1. Fetch form submission counts
    fetch('/api/admin/submissions?limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.counts as SubmissionCounts | undefined;
        if (c) setUnread(c.contacts.unread + c.academy.unread);
      })
      .catch(() => setUnread(0));

    // 2. Fetch pending applications count
    fetch('/api/admin/applications?status=submitted&limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.counts?.pending === 'number') {
          setPendingApps(d.counts.pending);
        }
      })
      .catch(() => setPendingApps(0));
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:flex font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:fixed lg:inset-y-0 z-40 border-r border-slate-800/80">
        <SidebarContent
          pathname={pathname}
          unread={unread}
          pendingApps={pendingApps}
          logout={logout}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          />
          <aside className="relative flex w-72 flex-col shadow-2xl z-50">
            <SidebarContent
              pathname={pathname}
              unread={unread}
              pendingApps={pendingApps}
              onClose={() => setDrawerOpen(false)}
              logout={logout}
            />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Modern Top Header */}
        <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-4 border-b border-slate-200/90 bg-white/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden border border-slate-200"
              aria-label="Open navigation menu"
            >
              <Icon d="M4 6h16M4 12h16M4 18h16" size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] font-semibold text-slate-400">Admin</span>
                <span className="hidden sm:inline text-[11px] text-slate-300">/</span>
                <h1 className="text-base font-bold text-slate-900 leading-tight">{title}</h1>
              </div>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {actions}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>Live Site</span>
              <span>↗</span>
            </Link>

            {/* User Greeting Pill (Matching Reference Design: "Hello, Brad") */}
            <div className="hidden md:flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1A4A] text-amber-400 font-bold text-xs shadow-sm ring-2 ring-amber-400/20">
                  AD
                </div>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium text-slate-400 leading-none">Hello,</p>
                <p className="text-xs font-bold text-slate-900 leading-tight">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Modern Action Buttons ── */
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
      className="inline-flex items-center gap-2 rounded-xl border border-amber-600 bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all shadow-sm hover:bg-amber-400 disabled:opacity-50"
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
      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm hover:bg-slate-800 disabled:opacity-50"
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
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      {previewing ? 'Opening…' : 'Preview'}
    </button>
  );
}

export function AdminCard({
  title,
  children,
  className = '',
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {title ? (
            <h2 className="text-sm font-bold tracking-tight text-slate-900">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
