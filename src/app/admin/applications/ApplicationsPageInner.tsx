'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminShell, AdminCard } from '@admin/components/AdminShell';
import type { UnifiedApplication } from '@/app/api/admin/applications/route';

type ModeratorScope = {
  id: string;
  email: string;
  roles: string[];
  isGlobal: boolean;
  scopedChapterIds: string[];
};

export default function ApplicationsPageInner() {
  const searchParams = useSearchParams();
  const linkIdFromUrl = searchParams.get('linkId') || '';

  const [applications, setApplications] = useState<UnifiedApplication[]>([]);
  const [moderator, setModerator] = useState<ModeratorScope | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLinkId, setActiveLinkId] = useState<string>(linkIdFromUrl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<UnifiedApplication | null>(null);

  useEffect(() => {
    setActiveLinkId(searchParams.get('linkId') || '');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (divisionFilter !== 'all') params.set('division', divisionFilter);
      if (activeLinkId) params.set('linkId', activeLinkId);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const qs = params.toString();
      const res = await fetch(`/api/admin/applications${qs ? `?${qs}` : ''}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load applications');
      }

      setApplications(data.applications || []);
      setModerator(data.moderator || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load applications queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, divisionFilter, activeLinkId, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = async (
    applicationId: string,
    decision: 'approve' | 'reject'
  ) => {
    let remarks: string | undefined;
    if (decision === 'reject') {
      const input = prompt('Enter optional rejection feedback or remarks:');
      if (input === null) return; // user cancelled
      remarks = input.trim() || undefined;
    }

    setActionInProgress(applicationId);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, remarks }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Review action failed.');
        return;
      }

      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp(null);
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Network error during review action.');
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20">
            ✓ Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-500/20">
            ✕ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-500/20">
            ● Pending Review
          </span>
        );
    }
  };

  return (
    <AdminShell
      title="Member Applications Review"
      description="Moderate incoming applications across all campaign links and active cohorts"
      actions={
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <svg
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{loading ? 'Refreshing…' : 'Refresh Queue'}</span>
        </button>
      }
    >
      {/* Active Campaign Filter Pill */}
      {activeLinkId && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-blue-50/80 p-3 text-xs text-blue-900 border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-bold">Filtered by Campaign:</span>
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-[11px]">{activeLinkId}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveLinkId('')}
            className="font-bold text-blue-700 underline hover:text-blue-900"
          >
            Clear Filter (Show All) ✕
          </button>
        </div>
      )}

      {/* Modern Filter Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'All Statuses' },
              { key: 'submitted', label: 'Pending Review' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Search candidate name, email, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {applications.length} applicant{applications.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Applications Table / Cards */}
      <AdminCard>
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading applicant data…</div>
        ) : applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const isProcessing = actionInProgress === app.id;
              const isPending = app.status === 'submitted' || app.status === 'under_review';

              return (
                <div key={app.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Applicant details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-extrabold text-xs text-blue-800 shadow-sm">
                        {app.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 truncate">{app.fullName}</h3>
                          {getStatusBadge(app.status)}
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            {app.division.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>📧 {app.email}</span>
                          <span>📞 {app.phone}</span>
                          <span>🏛️ {app.universityName}</span>
                          {app.campaignName && (
                            <span className="font-medium text-blue-600">
                              🔗 {app.campaignName}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Submitted: {new Date(app.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {app.contributionPitch && (
                          <p className="mt-2 text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                            &ldquo;{app.contributionPitch}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDecision(app.id, 'approve')}
                            disabled={isProcessing}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                          >
                            <span>✓ Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(app.id, 'reject')}
                            disabled={isProcessing}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
                          >
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-right text-[11px] text-slate-400">
                          Reviewed {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}
                          {app.reviewedBy && ` by ${app.reviewedBy}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-xl">
              📋
            </div>
            <p className="mt-3 text-xs font-bold text-slate-700">No applications match your filter criteria.</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Try switching your status filter or clearing search queries.
            </p>
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
