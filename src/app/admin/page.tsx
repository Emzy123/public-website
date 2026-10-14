'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AdminShell, AdminCard } from '@admin/components/AdminShell';
import type { SubmissionCounts } from '@admin/lib/submissions';
import type { RegistrationLink } from '@/lib/types/membership';
import type { UnifiedApplication } from '@/app/api/admin/applications/route';
import { formatWatDate, formatWatDateTime } from '@/lib/date';
import { StatusPill } from '@/components/ui/Badge';

function MetricCard({
  label,
  value,
  sub,
  badge,
  icon,
  badgeType = 'neutral',
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  icon: React.ReactNode;
  badgeType?: 'amber' | 'emerald' | 'blue' | 'neutral';
  href?: string;
}) {
  const badgeClasses = {
    amber: 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-700 ring-1 ring-blue-500/30',
    neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }[badgeType];

  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200/80 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-black tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>

      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const [submissionCounts, setSubmissionCounts] = useState<SubmissionCounts | null>(null);
  const [applications, setApplications] = useState<UnifiedApplication[]>([]);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number; total: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [activeLinks, setActiveLinks] = useState<RegistrationLink[]>([]);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      actorEmail: string;
      action: string;
      resource: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, appRes, auditRes] = await Promise.allSettled([
        fetch('/api/admin/submissions?limit=1').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/admin/applications').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/admin/audit?limit=5').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (subRes.status === 'fulfilled' && subRes.value?.counts) {
        setSubmissionCounts(subRes.value.counts);
      }

      if (appRes.status === 'fulfilled' && appRes.value) {
        const appsList: UnifiedApplication[] = appRes.value.applications || [];
        setApplications(appsList);
        if (appRes.value.counts) {
          setCounts(appRes.value.counts);
        } else {
          setCounts({
            total: appsList.length,
            pending: appsList.filter((a) => a.status === 'submitted' || a.status === 'under_review').length,
            approved: appsList.filter((a) => a.status === 'approved').length,
            rejected: appsList.filter((a) => a.status === 'rejected').length,
          });
        }

        const linksList: RegistrationLink[] = appRes.value.links || [];
        setActiveLinks(linksList);
      }

      if (auditRes.status === 'fulfilled' && auditRes.value?.logs) {
        setAuditLogs(auditRes.value.logs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/join/${slug}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    }
  };

  const handleQuickDecision = async (id: string, decision: 'approve' | 'reject') => {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update application decision.');
      }
    } catch {
      alert('Network error while recording decision.');
    } finally {
      setReviewingId(null);
    }
  };

  // Filtered recent applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (appFilter === 'pending' && !(app.status === 'submitted' || app.status === 'under_review')) {
        return false;
      }
      if (appFilter === 'approved' && app.status !== 'approved') return false;
      if (appFilter === 'rejected' && app.status !== 'rejected') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.fullName.toLowerCase().includes(q) ||
          app.email.toLowerCase().includes(q) ||
          app.division.toLowerCase().includes(q) ||
          (app.campaignName && app.campaignName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [applications, appFilter, searchQuery]);

  const totalSubmissions = submissionCounts
    ? submissionCounts.contacts.total + submissionCounts.academy.total
    : '—';
  const unreadCount = submissionCounts
    ? submissionCounts.contacts.unread + submissionCounts.academy.unread
    : 0;

  const openCampaignsCount = activeLinks.filter((l) => l.status === 'open').length;

  return (
    <AdminShell
      title="Executive Overview"
      description="Real-time admissions funnel, campaign links, and community operations"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <Link
            href="/admin/links"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span>+ Create Link</span>
          </Link>
        </div>
      }
    >
      {/* 1. Executive KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Applications"
          value={loading ? '…' : counts.total}
          badge={counts.total > 0 ? `${counts.total} received` : undefined}
          badgeType="blue"
          sub="Across all links & cohorts"
          href="/admin/applications"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <MetricCard
          label="Pending Moderation"
          value={loading ? '…' : counts.pending}
          badge={counts.pending > 0 ? 'Requires Action' : 'All Clear'}
          badgeType={counts.pending > 0 ? 'amber' : 'emerald'}
          sub={counts.pending > 0 ? 'Awaiting admissions review' : 'Queue fully processed'}
          href="/admin/applications?status=submitted"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricCard
          label="Active Campaign Links"
          value={loading ? '…' : openCampaignsCount}
          badge={openCampaignsCount > 0 ? 'Accepting' : 'No Open Links'}
          badgeType={openCampaignsCount > 0 ? 'emerald' : 'neutral'}
          sub={`${activeLinks.length} total campaigns configured`}
          href="/admin/links"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />

        <MetricCard
          label="Inbound Inquiries"
          value={loading ? '…' : totalSubmissions}
          badge={unreadCount > 0 ? `${unreadCount} new` : 'All Read'}
          badgeType={unreadCount > 0 ? 'amber' : 'neutral'}
          sub="Contact forms & Academy interest"
          href="/admin/submissions"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column (Primary Workflows) */}
        <div className="space-y-8 min-w-0">
          {/* Card A: Recent Applications Stream */}
          <AdminCard
            title="Applications Review Stream"
            actions={
              <Link
                href="/admin/applications"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Open Full Queue →
              </Link>
            }
          >
            {/* Filter Pills & Instant Search */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'all', label: 'All', count: counts.total },
                    { key: 'pending', label: 'Pending', count: counts.pending },
                    { key: 'approved', label: 'Approved', count: counts.approved },
                    { key: 'rejected', label: 'Rejected', count: counts.rejected },
                  ] as const
                ).map(({ key, label, count }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAppFilter(key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      appFilter === key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label} <span className="opacity-70 font-mono text-[10px]">({count})</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter candidate name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Application List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading incoming applications…</div>
            ) : filteredApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2.5">Applicant</th>
                      <th className="pb-2.5">Pathway / Role</th>
                      <th className="pb-2.5">Campaign Link</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.slice(0, 8).map((app) => {
                      const isPending = app.status === 'submitted' || app.status === 'under_review';
                      const isWorking = reviewingId === app.id;

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-[10px] text-blue-800">
                                {app.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{app.fullName}</p>
                                <p className="text-[11px] text-slate-500 truncate">{app.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 pr-3">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-700">
                              {app.division.replace('-', ' ')}
                            </span>
                          </td>

                          <td className="py-3 pr-3">
                            <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px] block">
                              {app.campaignName || 'SINet Drive'}
                            </span>
                          </td>

                          <td className="py-3 pr-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {formatWatDate(app.createdAt)}
                          </td>

                          <td className="py-3 pr-3">
                            <StatusPill status={app.status} />
                          </td>

                          <td className="py-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickDecision(app.id, 'approve')}
                                  disabled={isWorking}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                                >
                                  {isWorking ? '…' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickDecision(app.id, 'reject')}
                                  disabled={isWorking}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <Link
                                href={`/admin/applications`}
                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                              >
                                View Details →
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <p className="text-xs font-semibold text-slate-700">No applications match current filters.</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  When applicants complete your registration forms, they will appear here in real-time.
                </p>
              </div>
            )}
          </AdminCard>

          {/* Card B: Active Campaign Links & Admissions Drives */}
          <AdminCard
            title="Recruitment Campaigns & Link Funnels"
            actions={
              <Link
                href="/admin/links"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Manage All Links →
              </Link>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading campaign funnels…</div>
            ) : activeLinks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activeLinks.map((link) => {
                  const isOpen = link.status === 'open';
                  const isCopied = copiedSlug === link.slug;
                  const quotaPercent = link.quota
                    ? Math.min(100, Math.round((link.applicationCount / link.quota) * 100))
                    : null;

                  return (
                    <div key={link._id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{link.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                isOpen
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isOpen ? '● Accepting' : 'Closed'}
                            </span>
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                            /join/{link.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link.slug)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            <span>{isCopied ? '✓ Copied URL' : 'Copy Public URL'}</span>
                          </button>
                          <Link
                            href={`/admin/applications?linkId=${link._id}`}
                            className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition"
                          >
                            View Applicants ({link.applicationCount}) →
                          </Link>
                        </div>
                      </div>

                      {/* Quota Progress */}
                      {quotaPercent !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
                            <span>Quota Progress: {link.applicationCount} / {link.quota} seats</span>
                            <span>{quotaPercent}% filled</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${quotaPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <p className="text-xs font-semibold text-slate-700">No campaign links created yet.</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Create a registration link to accept applications for volunteers, staff, or community members.
                </p>
                <Link
                  href="/admin/links"
                  className="mt-3 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  + Create First Campaign Link
                </Link>
              </div>
            )}
          </AdminCard>
        </div>

        {/* Right Column (Secondary Hubs & Inquiries) */}
        <div className="space-y-6">
          {/* Card C: Quick Operations Hub */}
          <AdminCard title="Quick Actions Hub">
            <div className="grid gap-2">
              {[
                { href: '/admin/links', label: 'Create Campaign Link', icon: '🔗', desc: 'Set admissions funnels' },
                { href: '/admin/applications', label: 'Moderate Applications', icon: '📋', desc: 'Process review queue' },
                { href: '/admin/content/adverts', label: 'Publish Spotlight Flyer', icon: '📣', desc: 'Header banners & modals' },
                { href: '/admin/content/news', label: 'Publish News Update', icon: '📰', desc: 'Milestones & updates' },
                { href: '/admin/team', label: 'Manage Leadership Team', icon: '👥', desc: 'About page profiles' },
                { href: '/admin/content/site-settings', label: 'Configure Site Settings', icon: '⚙️', desc: 'Contact details & branding' },
              ].map(({ href, label, icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:bg-slate-50/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-700 text-xs transition">→</span>
                </Link>
              ))}
            </div>
          </AdminCard>

          {/* Card D: Inquiries by Topic Breakdown */}
          <AdminCard
            title="Inquiries by Topic"
            actions={
              <Link
                href="/admin/submissions"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Full Inbox ({unreadCount} unread) →
              </Link>
            }
          >
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading topic metrics…</div>
            ) : submissionCounts?.byTopic ? (
              <div className="space-y-1.5">
                {Object.entries(submissionCounts.byTopic).map(([topic, stats]) => (
                  <Link
                    key={topic}
                    href={`/admin/submissions?topic=${encodeURIComponent(topic)}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 transition-all hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{topic}</p>
                      <p className="text-[10px] text-slate-500">{stats.total} total received</p>
                    </div>
                    {stats.unread > 0 ? (
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-500/30">
                        {stats.unread} unread
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-slate-400 font-medium">All read</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No submissions found.</p>
            )}
          </AdminCard>

          {/* Card E: Recent Audit Events Feed */}
          <AdminCard
            title="Recent Audit Events"
            actions={
              <Link
                href="/admin/audit"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Audit Trail →
              </Link>
            }
          >
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading audit trail…</div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {formatWatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate font-sans font-medium text-slate-800">{log.actorEmail}</span>
                      <span className="truncate text-slate-400 text-[10px]">{log.resource}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No recent audit events logged.</p>
            )}
          </AdminCard>

          {/* Card E: Pilot Status & Campus Coverage */}
          <AdminCard title="Kogi State Campuses Pilot">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Pilot Chapters</span>
                <span className="font-bold text-slate-900">6 Active Universities</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Lead University</span>
                <span className="font-bold text-slate-900">Federal University Lokoja (FULOKOJA)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Database Architecture</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Dual-Store Resilient Sync
                </span>
              </div>
              <div className="pt-1">
                <Link
                  href="/chapters"
                  target="_blank"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Explore public chapters directory</span>
                  <span>↗</span>
                </Link>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
