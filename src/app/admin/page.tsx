'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell, AdminCard } from '@admin/components/AdminShell';
import type { SubmissionCounts } from '@admin/lib/submissions';
import type { RegistrationLink } from '@/lib/types/membership';

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e4dcc9] bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#7b7263]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ? 'text-[#d9a23c]' : 'text-[#0d1a4a]'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[#7b7263]">{sub}</p>}
    </div>
  );
}

function QuickAction({ href, label, description, icon }: { href: string; label: string; description: string; icon: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-xl border border-[#e4dcc9] bg-white p-4 transition-colors hover:border-[#d9a23c] hover:bg-[#fdf8ef]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0e9d9] text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#0d1a4a]">{label}</p>
        <p className="truncate text-xs text-[#7b7263]">{description}</p>
      </div>
      <span className="ml-auto shrink-0 text-[#d9a23c]">→</span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [submissionCounts, setSubmissionCounts] = useState<SubmissionCounts | null>(null);
  const [pendingApps, setPendingApps] = useState(0);
  const [totalApps, setTotalApps] = useState(0);
  const [activeLinks, setActiveLinks] = useState<RegistrationLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [subRes, appRes] = await Promise.allSettled([
          fetch('/api/admin/submissions?limit=1').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/admin/applications').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (subRes.status === 'fulfilled' && subRes.value?.counts) {
          setSubmissionCounts(subRes.value.counts);
        }

        if (appRes.status === 'fulfilled' && appRes.value) {
          setTotalApps(appRes.value.total ?? appRes.value.applications?.length ?? 0);
          setPendingApps(appRes.value.counts?.pending ?? 0);
          const links: RegistrationLink[] = appRes.value.links || [];
          setActiveLinks(links.filter((l) => l.status === 'open'));
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const totalSubmissions = submissionCounts ? submissionCounts.contacts.total + submissionCounts.academy.total : '—';
  const unreadCount = submissionCounts ? submissionCounts.contacts.unread + submissionCounts.academy.unread : 0;

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Applications" value={loading ? '…' : totalApps} sub={pendingApps > 0 ? `${pendingApps} pending review` : 'All reviewed'} accent />
        <StatCard label="Pending Review" value={loading ? '…' : pendingApps} sub="Needs attention" accent={pendingApps > 0} />
        <StatCard label="Active Campaign Links" value={loading ? '…' : activeLinks.length} sub="Accepting applications" />
        <StatCard label="Form Submissions" value={loading ? '…' : totalSubmissions} sub={unreadCount > 0 ? `${unreadCount} unread` : 'All read'} accent={unreadCount > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <AdminCard title="Applications by Active Link">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#7b7263]">Loading…</p>
          ) : activeLinks.length > 0 ? (
            <div className="space-y-3">
              {activeLinks.map((link) => (
                <div key={link._id} className="flex items-center justify-between rounded-lg border border-[#e4dcc9] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0d1a4a]">{link.name}</p>
                    <p className="text-xs text-[#7b7263]">{link.applicationCount} received{link.quota ? ` · quota ${link.quota}` : ''}</p>
                  </div>
                  <Link href={`/admin/links`} className="text-xs font-semibold text-[#d9a23c] hover:underline">Manage →</Link>
                </div>
              ))}
              {pendingApps > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#fbeadf] bg-[#fdf5ec] px-4 py-3">
                  <p className="text-sm text-[#0d1a4a]"><span className="font-semibold text-[#d9711b]">{pendingApps}</span> application{pendingApps !== 1 ? 's' : ''} pending review</p>
                  <Link href="/admin/applications" className="text-xs font-semibold text-[#d9711b] hover:underline">Review →</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-[#7b7263]">No active campaign links.</p>
              <Link href="/admin/links" className="mt-2 inline-block text-xs font-semibold text-[#d9a23c] hover:underline">Create a registration link →</Link>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Form Submissions">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#7b7263]">Loading…</p>
          ) : submissionCounts ? (
            <div className="space-y-3">
              {[
                { label: 'Contact messages', total: submissionCounts.contacts.total, unread: submissionCounts.contacts.unread },
                { label: 'Academy interest', total: submissionCounts.academy.total, unread: submissionCounts.academy.unread },
              ].map(({ label, total, unread }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-[#e4dcc9] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0d1a4a]">{label}</p>
                    <p className="text-xs text-[#7b7263]">{total} total</p>
                  </div>
                  {unread > 0 ? <span className="rounded-full bg-[#d9a23c] px-2.5 py-1 text-xs font-bold text-[#0d1a4a]">{unread} new</span> : <span className="text-xs text-[#b0a799]">All read</span>}
                </div>
              ))}
              <Link href="/admin/submissions" className="mt-2 block rounded-lg border border-[#e4dcc9] py-2.5 text-center text-sm font-medium text-[#0d1a4a] hover:border-[#d9a23c]">View all submissions →</Link>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#7b7263]">No submissions yet.</p>
          )}
        </AdminCard>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/admin/links" label="Link Management" description="Create and control registration links" icon="🔗" />
          <QuickAction href="/admin/applications" label="Review Applications" description="View and process pending applications" icon="📋" />
          <QuickAction href="/admin/content/adverts" label="Events & Flyers" description="Post special events, adverts, and flyers" icon="📣" />
          <QuickAction href="/admin/content/news" label="News & Updates" description="Publish milestones and announcements" icon="📰" />
          <QuickAction href="/admin/submissions" label="Form Submissions" description="Contact messages and academy interest" icon="✉️" />
          <QuickAction href="/admin/team" label="Leadership Team" description="Manage About page team profiles" icon="👥" />
          <QuickAction href="/admin/content" label="Edit Content" description="Update pages, products, partners, gallery" icon="✏️" />
          <QuickAction href="/admin/content/site-settings" label="Site Settings" description="Logo, contact links, global config" icon="⚙️" />
          <QuickAction href="/" label="View Public Site" description="Open the live site" icon="🌐" />
        </div>
      </div>
    </AdminShell>
  );
}
