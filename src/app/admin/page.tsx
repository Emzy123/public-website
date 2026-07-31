'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@admin/components/AdminShell';
import { CMS_KEYS } from '@admin/lib/cms/keys';
import type { SubmissionCounts } from '@admin/lib/submissions';

export default function AdminDashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [counts, setCounts] = useState<SubmissionCounts | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d) => setEmail(d.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  useEffect(() => {
    fetch('/api/admin/submissions?limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCounts(d?.counts ?? null))
      .catch(() => setCounts(null));
  }, []);

  const groups = ['Home', 'Pages', 'Settings'] as const;
  const unreadTotal = counts ? counts.contacts.unread + counts.academy.unread : 0;

  return (
    <AdminShell title="Dashboard" description={email ? `Signed in as ${email}` : 'Content management overview'}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">{group}</h2>
            <ul className="space-y-2">
              {CMS_KEYS.filter((k) => k.group === group).map((item) => (
                <li key={item.key}>
                  <Link href={`/admin/content/${item.key}`} className="block text-sm text-slate-300 hover:text-white transition-colors">
                    {item.label}
                    <span className="block text-xs text-slate-500">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">Inbox</h2>
          <Link href="/admin/submissions" className="block text-sm text-slate-300 hover:text-white">
            <span className="inline-flex items-center gap-2">
              Form Submissions
              {unreadTotal > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4AF37] text-[#0A2342] text-xs font-bold">
                  {unreadTotal}
                </span>
              )}
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              Contact & academy interest messages
              {counts && unreadTotal > 0 ? ` · ${unreadTotal} unread` : ''}
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-8 p-5 rounded-xl border border-slate-800 bg-slate-900/40">
        <h3 className="font-semibold mb-2">Getting started</h3>
        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
          <li>Run <code className="text-[#D4AF37]">npm run seed:cms</code> to populate MongoDB with current site content</li>
          <li>Edit content in any section above — <strong>Save Draft</strong> stores changes without going live</li>
          <li>Use <strong>Preview</strong> to review drafts, then <strong>Publish</strong> to update the live site</li>
        </ol>
      </div>
    </AdminShell>
  );
}
