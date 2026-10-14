'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from '@admin/components/AdminShell';
import { StatusPill } from '@/components/ui/Badge';
import { formatWatDateTime } from '@/lib/date';

type Detail = {
  _id: string;
  pathwayLabel: string;
  role: string;
  status: string;
  reviewNote: string;
  reviewedBy: string;
  sourceLinkName: string;
  sourceLinkSlug: string;
  submittedAt?: string;
  updatedAt?: string;
  agreementMeta?: Record<string, unknown> | null;
  fields: { key: string; label: string; value: string }[];
  documents: { key: string; label: string; id: string; downloadUrl: string }[];
};

const REJECTION_PRESETS = [
  'Incomplete statement of interest or background information.',
  'Missing required verification documents or unreadable attachment.',
  'Applicant does not meet current student or cohort enrollment criteria.',
  'Current cohort cohort quota reached for the selected pathway.',
  'Incorrect university or campus branch specified.',
];

function StatusBadge({ status }: { status: string }) {
  return <StatusPill status={status} />;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const [app, setApp] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<{
    label: string;
    url: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load application');
      setApp(data.application);
      setDeclineReason(data.application?.reviewNote || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  const submitDecision = async (decision: 'approve' | 'reject', remarks?: string) => {
    setUpdating(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/applications/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          remarks: remarks?.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit decision');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update application');
    } finally {
      setUpdating(false);
    }
  };

  const name = app?.fields.find((f) => f.key === 'fullName')?.value || 'Application';

  return (
    <AdminShell title="Application Review" description="Inspect full applicant details, inspect documents, and make admission decisions">
      <div className="mb-4">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D1A4A] hover:text-amber-600 transition"
        >
          <span>←</span> Back to Admissions Console
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading || !app ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500 shadow-sm">
          {loading ? 'Loading application dossier…' : 'Application record not found.'}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Dossier Content */}
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0D1A4A] text-amber-400 font-bold text-lg shadow-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                      <p className="text-xs text-slate-500 font-medium">
                        {app.pathwayLabel}
                        {app.sourceLinkName ? ` · via ${app.sourceLinkName}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs sm:grid-cols-4">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Submitted</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {app.submittedAt ? formatWatDateTime(app.submittedAt) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Last Updated</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {app.updatedAt ? formatWatDateTime(app.updatedAt) : '—'}
                  </dd>
                </div>
                {app.reviewedBy && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Reviewed By</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{app.reviewedBy}</dd>
                  </div>
                )}
                {app.sourceLinkSlug && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Campaign Scope</dt>
                    <dd className="mt-1 font-mono font-medium text-amber-700">{app.sourceLinkSlug}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Submitted Responses */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900">Applicant Form Responses</h2>
              </div>
              <div className="divide-y divide-slate-100 px-6">
                {app.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-xs font-medium text-slate-500">{field.label}</span>
                    <span className="text-xs font-semibold text-slate-900 sm:max-w-[65%] sm:text-right break-words">
                      {field.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Verification Documents */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Verification Documents ({app.documents.length})</h2>
                <span className="text-[11px] text-slate-400">Click preview to inspect inline</span>
              </div>

              {app.documents.length === 0 ? (
                <p className="px-6 py-8 text-center text-xs text-slate-400">
                  No verification documents attached to this application record.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {app.documents.map((doc) => (
                    <div key={doc.key} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                          📄
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewDoc({ label: doc.label, url: doc.downloadUrl })}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                        >
                          Preview
                        </button>
                        <a
                          href={doc.downloadUrl}
                          download
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Document Preview Box (When Active) */}
            {selectedPreviewDoc && (
              <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900">
                      Live Preview: {selectedPreviewDoc.label}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewDoc(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ✕ Close Preview
                  </button>
                </div>
                <div className="mt-4 flex justify-center bg-slate-950/5 rounded-xl p-2 min-h-[350px]">
                  <iframe
                    src={selectedPreviewDoc.url}
                    className="w-full h-[500px] rounded-lg border border-slate-200 bg-white"
                    title={selectedPreviewDoc.label}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Decision Panel Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Review Determination
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Auto-Email Active
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Evaluating this application will automatically dispatch an official notification email to{' '}
                <strong className="text-slate-700">
                  {app.fields.find((f) => f.key === 'email')?.value || 'the applicant'}
                </strong>.
              </p>

              {app.reviewNote && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recorded Reason / Note</p>
                  <p className="mt-1 text-xs text-slate-700 font-medium">{app.reviewNote}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Accept and approve application for ${name}? An official acceptance email with portal login instructions will be sent.`)) {
                      void submitDecision('approve');
                    }
                  }}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  <span>✓</span> Accept & Send Approval Email
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 mb-1.5">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </p>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Provide constructive feedback for rejection..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0D1A4A] focus:outline-none"
                  />

                  {/* Preset Reasons */}
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400">Quick Reason Presets:</p>
                    <div className="flex flex-wrap gap-1">
                      {REJECTION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDeclineReason(preset)}
                          className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200 hover:text-slate-800 text-left transition"
                        >
                          {preset.slice(0, 32)}…
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!declineReason.trim()) {
                        alert('Please enter or select a rejection reason to guide the applicant.');
                        return;
                      }
                      if (window.confirm(`Decline application for ${name}? The applicant will be notified with your feedback.`)) {
                        void submitDecision('reject', declineReason);
                      }
                    }}
                    disabled={updating}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
                  >
                    <span>✕</span> Reject with Reason & Notify
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/admin/applications')}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2 transition"
            >
              Return to Applications Queue
            </button>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
