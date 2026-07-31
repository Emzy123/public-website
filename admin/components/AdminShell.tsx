'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CMS_KEYS } from '@admin/lib/cms/keys';
import type { SubmissionCounts } from '@admin/lib/submissions';

const NAV_GROUPS = ['Home', 'Pages', 'Settings', 'Inbox'] as const;

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
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    fetch('/api/admin/submissions?limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const counts = d?.counts as SubmissionCounts | undefined;
        if (counts) setUnreadTotal(counts.contacts.unread + counts.academy.unread);
      })
      .catch(() => setUnreadTotal(0));
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', group: 'Home' as const },
    ...CMS_KEYS.map((k) => ({
      href: `/admin/content/${k.key}`,
      label: k.label,
      group: k.group as (typeof NAV_GROUPS)[number],
    })),
    { href: '/admin/submissions', label: 'Submissions', group: 'Inbox' as const, badge: unreadTotal },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#0A1929] flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <Link href="/admin" className="text-lg font-bold text-[#D4AF37]">
            SINet Admin
          </Link>
          <p className="text-xs text-slate-500 mt-1">Content Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {NAV_GROUPS.map((group) => {
            const items = navItems.filter((n) => n.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="px-3 text-[10px] uppercase tracking-widest text-slate-500 mb-2">{group}</p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href;
                    const badge = 'badge' in item ? item.badge : 0;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-medium'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{item.label}</span>
                          {badge > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4AF37] text-[#0A2342] text-xs font-bold">
                              {badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/" target="_blank" className="block text-xs text-slate-400 hover:text-[#D4AF37]">
            View live site →
          </Link>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-800 bg-slate-900/50 px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
          </div>
          {actions}
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

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
      className="px-5 py-2 rounded-lg bg-[#D4AF37] text-[#0A2342] font-semibold text-sm hover:bg-[#F4D03F] disabled:opacity-50 transition-colors"
    >
      {saving ? 'Saving…' : saved ? 'Draft saved ✓' : label}
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
      className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
    >
      {publishing ? 'Publishing…' : published ? 'Published ✓' : 'Publish'}
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
      className="px-5 py-2 rounded-lg border border-slate-600 text-slate-200 font-semibold text-sm hover:border-slate-400 hover:text-white disabled:opacity-50 transition-colors"
    >
      {previewing ? 'Opening…' : 'Preview'}
    </button>
  );
}

export function AdminCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      {title && <h2 className="text-base font-semibold text-[#D4AF37]">{title}</h2>}
      {children}
    </div>
  );
}
