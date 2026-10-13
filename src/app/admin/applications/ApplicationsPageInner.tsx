'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ApplicationItem = {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  userId: string | null;
  universityId: string;
  universityName: string;
  universityShortName: string;
  fullName: string;
  email: string;
  phone: string;
  programme: string;
  level: string;
  division: 'student_finance' | 'student_enterprise' | 'governance_records';
  contributionPitch: string;
  photoUrl: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewRemarks: string | null;
  createdAt: string;
};

type ModeratorScope = {
  id: string;
  email: string;
  roles: string[];
  isGlobal: boolean;
  scopedChapterIds: string[];
};

export default function ApplicationsPageInner() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [moderator, setModerator] = useState<ModeratorScope | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (divisionFilter !== 'all') params.set('division', divisionFilter);
      if (universityFilter !== 'all') params.set('universityId', universityFilter);

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
  }, [statusFilter, divisionFilter, universityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = async (
    applicationId: string,
    decision: 'approve' | 'reject'
  ) => {
    let remarks: string | undefined;
    if (decision === 'reject') {
      const input = prompt('Enter rejection feedback or remarks for the applicant:');
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

      // Reload list
      load();
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
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            ✓ Approved & Active
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
            ✕ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            ● Pending Review
          </span>
        );
    }
  };

  const getDivisionBadge = (division: string) => {
    switch (division) {
      case 'student_finance':
        return (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Finance Division
          </span>
        );
      case 'student_enterprise':
        return (
          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
            Enterprise Division
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800">
            Governance & Records
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-wider text-amber-700 hover:text-amber-800"
            >
              ← Admin Home
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-bold text-[#071026]">Student Admissions Review Queue</span>
          </div>

          <div className="flex items-center gap-3">
            {moderator && (
              <span className="hidden text-xs text-slate-500 sm:inline">
                {moderator.isGlobal ? 'Global Admin' : 'Chapter Lead Moderator'}: {moderator.email}
              </span>
            )}
            <Link
              href="/admin/audit"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Audit Log →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        {/* Banner */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-700">
              Student Investment Network • Kogi Campuses Pilot
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#071026] sm:text-3xl">
              Member Applications Queue
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Review and moderate incoming student member applications. Approving an applicant provisions
              their role, assigns their campus chapter, and mints their digital Member ID.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {loading ? 'Refreshing…' : '↻ Refresh Queue'}
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Division
            </label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="mt-1 rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none"
            >
              <option value="all">All Divisions</option>
              <option value="student_finance">Student Finance</option>
              <option value="student_enterprise">Student Enterprise</option>
              <option value="governance_records">Governance & Records</option>
            </select>
          </div>

          <div className="ml-auto text-xs font-semibold text-slate-500 self-end py-2">
            Showing {applications.length} applications
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {applications.map((app) => {
            const isProcessing = actionInProgress === app.id;
            const isPending = app.status === 'submitted' || app.status === 'under_review';

            return (
              <div
                key={app.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {app.universityShortName}
                      </span>
                      <span className="text-slate-300">•</span>
                      {getDivisionBadge(app.division)}
                      <span className="text-slate-300">•</span>
                      {getStatusBadge(app.status)}
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-[#071026]">{app.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      {app.email} • {app.phone}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {app.programme} ({app.level} Level) • {app.universityName}
                    </p>
                  </div>

                  {/* Actions for Pending Applications */}
                  {isPending && (
                    <div className="flex items-center gap-2 sm:self-start">
                      <button
                        onClick={() => handleDecision(app.id, 'approve')}
                        disabled={isProcessing}
                        className="inline-flex min-h-[38px] items-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing…' : '✓ Approve & Mint ID'}
                      </button>
                      <button
                        onClick={() => handleDecision(app.id, 'reject')}
                        disabled={isProcessing}
                        className="inline-flex min-h-[38px] items-center rounded-xl border border-rose-300 bg-rose-50 px-3.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Pitch Statement */}
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900">Interest / Contribution Pitch:</span>{' '}
                  {app.contributionPitch}
                </div>

                {/* Timestamp & Review metadata */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    Submitted on{' '}
                    {new Date(app.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {app.reviewedAt && (
                    <span>
                      Reviewed on {new Date(app.reviewedAt).toLocaleDateString()}
                      {app.reviewRemarks ? ` — Remarks: "${app.reviewRemarks}"` : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {applications.length === 0 && !loading && (
            <div className="my-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
              No applications in the queue matching the selected filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
