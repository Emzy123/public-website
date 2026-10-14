'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminShell } from '@admin/components/AdminShell';
import type { UnifiedApplication } from '@/app/api/admin/applications/route';
import { StatusPill } from '@/components/ui/Badge';
import { formatWatDate } from '@/lib/date';

type ModeratorScope = {
  id: string;
  email: string;
  roles: string[];
  isGlobal: boolean;
  scopedChapterIds: string[];
};

const PRESET_REJECTION_REASONS = [
  'Missing valid student identification or matriculation verification',
  'Institution not currently eligible for this pilot cohort',
  'Academic level does not meet current programme prerequisite',
  'Incomplete statement of interest or contribution pitch',
  'Cohort capacity limit reached for this campus chapter',
];

export default function ApplicationsPageInner() {
  const searchParams = useSearchParams();
  const linkIdFromUrl = searchParams.get('linkId') || '';

  const [applications, setApplications] = useState<UnifiedApplication[]>([]);
  const [moderator, setModerator] = useState<ModeratorScope | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLinkId, setActiveLinkId] = useState<string>(linkIdFromUrl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Drawer & Review State
  const [selectedApp, setSelectedApp] = useState<UnifiedApplication | null>(null);
  const [drawerTab, setDrawerTab] = useState<'responses' | 'documents' | 'decision'>('responses');
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActiveLinkId(searchParams.get('linkId') || '');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
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
      setError(err instanceof Error ? err.message : 'Unable to load admissions queue');
    } finally {
      setLoading(false);
    }
  }, [activeTab, divisionFilter, activeLinkId, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;
    const acceptanceRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const targetQuota = 300;

    return { total, pending, approved, rejected, acceptanceRate, targetQuota };
  }, [applications]);

  // Unique institutions for filter dropdown
  const universityOptions = useMemo(() => {
    const unis = new Set<string>();
    applications.forEach((a) => {
      if (a.universityName) unis.add(a.universityName);
    });
    return Array.from(unis);
  }, [applications]);

  // Filtered applications list
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab !== 'all') {
        if (activeTab === 'submitted' && app.status !== 'submitted' && app.status !== 'under_review') return false;
        if (activeTab === 'approved' && app.status !== 'approved') return false;
        if (activeTab === 'rejected' && app.status !== 'rejected') return false;
      }
      if (divisionFilter !== 'all' && app.division !== divisionFilter) return false;
      if (universityFilter !== 'all' && app.universityName !== universityFilter) return false;
      return true;
    });
  }, [applications, activeTab, divisionFilter, universityFilter]);

  // Open drawer for an application
  const openReviewDrawer = (app: UnifiedApplication, initialTab: 'responses' | 'documents' | 'decision' = 'responses') => {
    setSelectedApp(app);
    setDrawerTab(initialTab);
    setDecisionType(app.status === 'rejected' ? 'reject' : 'approve');
    setDecisionRemarks(app.reviewRemarks || '');
    setFeedbackBanner(null);
  };

  const closeReviewDrawer = () => {
    setSelectedApp(null);
    setFeedbackBanner(null);
  };

  // Submit single decision
  const handleSubmitDecision = async () => {
    if (!selectedApp) return;

    setActionInProgress(selectedApp.id);
    setFeedbackBanner(null);

    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          remarks: decisionRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit decision');
      }

      setFeedbackBanner({
        type: 'success',
        message: `Application ${decisionType === 'approve' ? 'approved' : 'rejected'} successfully. Notification email dispatched to applicant.`,
      });

      // Refresh applications list
      await load();

      // Update local selectedApp copy
      setSelectedApp((prev) =>
        prev
          ? {
              ...prev,
              status: decisionType === 'approve' ? 'approved' : 'rejected',
              reviewedBy: moderator?.email || 'admin@sinet.africa',
              reviewedAt: new Date().toISOString(),
              reviewRemarks: decisionRemarks.trim() || null,
            }
          : null
      );
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error submitting review decision',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Decision from table
  const handleQuickDecision = async (appId: string, decision: 'approve' | 'reject') => {
    let remarks: string | undefined;
    if (decision === 'reject') {
      const input = prompt('Enter reason for rejection:');
      if (input === null) return;
      remarks = input.trim() || undefined;
    }

    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, remarks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');

      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error executing decision');
    } finally {
      setActionInProgress(null);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredApps.length === 0) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Institution', 'Programme', 'Level', 'Division', 'Status', 'Submitted At', 'Review Remarks'];
    const rows = filteredApps.map((a) => [
      `"${a.fullName.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.universityName.replace(/"/g, '""')}"`,
      `"${a.programme.replace(/"/g, '""')}"`,
      `"${a.level}"`,
      `"${a.division}"`,
      `"${a.status}"`,
      `"${new Date(a.createdAt).toLocaleDateString()}"`,
      `"${(a.reviewRemarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sinet_admissions_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Checkbox batch selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Executive Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>DASHBOARD</span>
            <span>&gt;</span>
            <span className="text-[#0D1A4A] font-bold">Admissions &amp; Funnels</span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Admissions &amp; Applications Console
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Review applicant credentials, inspect attached documents &amp; responses, and evaluate admissions candidates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/join"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <span>👁️ Preview Form</span>
          </Link>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 transition"
          >
            <span>📥 Export CSV</span>
          </button>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D1A4A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-900 transition disabled:opacity-50"
          >
            <span>⟳ Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Overview Card (Matching Reference Design Layout) ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          {/* Circular SVG Donut Gauge */}
          <div className="flex items-center gap-5 sm:border-r sm:border-slate-100 sm:pr-8">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Progress Ring */}
                <path
                  className="text-amber-500"
                  strokeDasharray={`${metrics.acceptanceRate}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-slate-900 leading-none">
                  {metrics.acceptanceRate}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  Accepted
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cohort Admissions Pace
              </p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {metrics.approved} <span className="text-xs font-semibold text-slate-400">/ {metrics.total} Total</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Targeting <strong className="text-slate-700">{metrics.targetQuota} seats</strong> in current campus term.
              </p>
            </div>
          </div>

          {/* Metric Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1 py-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                ● Pending Review
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900 leading-none">
                {metrics.pending}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Awaiting committee decision</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                ✓ Accepted Members
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900 leading-none">
                {metrics.approved}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Active member credentials minted</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                ✕ Rejected / Declined
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900 leading-none">
                {metrics.rejected}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Detailed feedback dispatched</p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center justify-end lg:border-l lg:border-slate-100 lg:pl-6">
            <button
              onClick={handleExportCsv}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
            >
              <span>📥</span>
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Segmented Pill Tabs Bar (Matching Screenshot) ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'all', label: 'All Applications', count: metrics.total },
          { key: 'submitted', label: 'Pending Review', count: metrics.pending, color: 'bg-amber-100 text-amber-800' },
          { key: 'approved', label: 'Approved Members', count: metrics.approved, color: 'bg-emerald-100 text-emerald-800' },
          { key: 'rejected', label: 'Rejected', count: metrics.rejected, color: 'bg-rose-100 text-rose-800' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.key
                ? 'bg-[#0D1A4A] text-white shadow-sm ring-1 ring-[#0D1A4A]'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-amber-400 text-slate-950' : tab.color || 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── 4. Control & Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, campus..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
          </div>

          {/* Division / Pathway Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Divisions &amp; Roles</option>
            <option value="student_finance">Student Finance</option>
            <option value="student_enterprise">Student Enterprise</option>
            <option value="governance_records">Governance &amp; Records</option>
          </select>

          {/* University / Campus Filter */}
          {universityOptions.length > 0 && (
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Higher Campuses</option>
              {universityOptions.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Batch Actions when items are selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="text-xs font-bold text-amber-900">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => {
                if (confirm(`Approve ${selectedIds.size} selected applications?`)) {
                  Array.from(selectedIds).forEach((id) => handleQuickDecision(id, 'approve'));
                  setSelectedIds(new Set());
                }
              }}
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
            >
              Batch Approve
            </button>
            <button
              onClick={() => {
                if (confirm(`Reject ${selectedIds.size} selected applications?`)) {
                  Array.from(selectedIds).forEach((id) => handleQuickDecision(id, 'reject'));
                  setSelectedIds(new Set());
                }
              }}
              className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
            >
              Batch Reject
            </button>
          </div>
        )}
      </div>

      {/* ── 5. High-Contrast Data Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0D1A4A]" />
            <p className="mt-3 text-xs font-semibold">Loading admissions records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <p className="font-bold">Error loading applications</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl">📋</span>
            <h3 className="mt-3 text-sm font-bold text-slate-800">No applications found</h3>
            <p className="mt-1 text-xs text-slate-400">
              {searchQuery || divisionFilter !== 'all' || universityFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'No candidates have submitted admissions applications in this view yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredApps.length && filteredApps.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Student Division / Role</th>
                  <th className="py-3 px-4">Campus / Programme</th>
                  <th className="py-3 px-4 text-center">Documents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.map((app) => {
                  const isPending = app.status === 'submitted' || app.status === 'under_review';
                  const isApproved = app.status === 'approved';
                  const isRejected = app.status === 'rejected';

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => openReviewDrawer(app)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelectOne(app.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Applicant Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D1A4A] text-amber-400 font-black text-xs ring-1 ring-slate-200">
                            {app.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {app.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400">{app.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Division Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                          {app.division.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      {/* Campus & Programme */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{app.universityName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {app.programme} • {app.level}
                        </p>
                      </td>

                      {/* Documents Badge (Interactive) */}
                      <td className="py-3 px-4 text-center" onClick={(e) => { e.stopPropagation(); openReviewDrawer(app, 'documents'); }}>
                        {app.documentCount && app.documentCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200 transition">
                            <span>📄</span>
                            <span>{app.documentCount} {app.documentCount === 1 ? 'doc' : 'docs'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <StatusPill status={app.status} />
                      </td>

                      {/* Submission Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatWatDate(app.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openReviewDrawer(app)}
                            className="rounded-lg bg-[#0D1A4A] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-900 transition"
                          >
                            Review
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleQuickDecision(app.id, 'approve')}
                                disabled={actionInProgress === app.id}
                                title="Approve"
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleQuickDecision(app.id, 'reject')}
                                disabled={actionInProgress === app.id}
                                title="Reject"
                                className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100 transition"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. Comprehensive Slide-Over Review Drawer & Modal ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1A4A] text-amber-400 font-black text-sm">
                  {selectedApp.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedApp.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedApp.email} • {selectedApp.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill status={selectedApp.status} />
                <button
                  onClick={closeReviewDrawer}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-xs font-bold">
              <button
                onClick={() => setDrawerTab('responses')}
                className={`py-3 border-b-2 transition ${
                  drawerTab === 'responses'
                    ? 'border-[#0D1A4A] text-[#0D1A4A]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                1. Form Responses &amp; Profile
              </button>

              <button
                onClick={() => setDrawerTab('documents')}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  drawerTab === 'documents'
                    ? 'border-[#0D1A4A] text-[#0D1A4A]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>2. Attached Documents</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px]">
                  {selectedApp.documents?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setDrawerTab('decision')}
                className={`py-3 border-b-2 transition ${
                  drawerTab === 'decision'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                3. Review Decision &amp; Feedback
              </button>
            </div>

            {/* Notification Feedback Banner */}
            {feedbackBanner && (
              <div
                className={`mx-6 mt-4 p-3 rounded-xl border text-xs font-medium ${
                  feedbackBanner.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {feedbackBanner.message}
              </div>
            )}

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: FORM RESPONSES */}
              {drawerTab === 'responses' && (
                <div className="space-y-6">
                  {/* Academic Credentials */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Academic Institution &amp; Cohort
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Institution:</span>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedApp.universityName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Student Division:</span>
                        <p className="font-bold text-blue-700 mt-0.5">{selectedApp.division.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Academic Programme:</span>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedApp.programme}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Level of Study:</span>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedApp.level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Statement of Interest / Contribution Pitch */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Statement of Interest &amp; Contribution Pitch
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 italic border-l-2 border-blue-400 pl-3">
                      &ldquo;{selectedApp.contributionPitch || 'No pitch statement recorded.'}&rdquo;
                    </p>
                  </div>

                  {/* Historical Review Feedback if present */}
                  {selectedApp.reviewRemarks && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Recorded Review Remarks
                      </h4>
                      <p className="text-xs text-slate-800">{selectedApp.reviewRemarks}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Reviewed by {selectedApp.reviewedBy || 'Moderator'} on{' '}
                        {selectedApp.reviewedAt ? new Date(selectedApp.reviewedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ATTACHED DOCUMENTS & PREVIEWS */}
              {drawerTab === 'documents' && (
                <div className="space-y-6">
                  {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <span className="text-3xl">📁</span>
                      <p className="mt-2 text-xs font-bold text-slate-700">No documents attached</p>
                      <p className="text-[11px] text-slate-400">The applicant did not attach external files with this submission.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {selectedApp.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 capitalize">{doc.label}</p>
                              <p className="text-[10px] text-slate-400">ID: {doc.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                              >
                                Open Fullscreen ↗
                              </a>
                              <a
                                href={doc.downloadUrl}
                                download
                                className="rounded-lg bg-[#0D1A4A] px-3 py-1 text-xs font-bold text-white hover:bg-blue-900 transition shadow-sm"
                              >
                                Download 📥
                              </a>
                            </div>
                          </div>

                          {/* Inline Document Preview (Images & PDFs) */}
                          <div className="aspect-[16/10] w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-inner flex items-center justify-center">
                            {/* If image */}
                            <iframe
                              src={doc.downloadUrl}
                              title={doc.label}
                              className="w-full h-full border-0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REVIEW DECISION & REJECTION REASON */}
              {drawerTab === 'decision' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Review Determination
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecisionType('approve')}
                        className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          decisionType === 'approve'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base">✓</span>
                        <span>Approve Application</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionType('reject')}
                        className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          decisionType === 'reject'
                            ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base">✕</span>
                        <span>Reject Application</span>
                      </button>
                    </div>
                  </div>

                  {/* Rejection Preset Quick-Tags */}
                  {decisionType === 'reject' && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600">Quick Reason Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_REJECTION_REASONS.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setDecisionRemarks(reason)}
                            className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition"
                          >
                            + {reason}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Feedback & Remarks Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {decisionType === 'reject' ? 'Rejection Reason / Feedback' : 'Approval Welcome Remarks (Optional)'}
                    </label>
                    <textarea
                      rows={4}
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      placeholder={
                        decisionType === 'reject'
                          ? 'Specify clear feedback explaining why this application was not approved...'
                          : 'Optional welcome message to include in onboarding confirmation...'
                      }
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Notify Email Toggle */}
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={notifyApplicant}
                      onChange={(e) => setNotifyApplicant(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Send automated decision notification email to <strong>{selectedApp.email}</strong>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={closeReviewDrawer}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Close Drawer
              </button>

              <button
                onClick={handleSubmitDecision}
                disabled={actionInProgress === selectedApp.id}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition shadow-sm disabled:opacity-50 ${
                  decisionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionInProgress === selectedApp.id
                  ? 'Processing...'
                  : decisionType === 'approve'
                  ? 'Confirm & Approve Application'
                  : 'Submit Rejection & Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
