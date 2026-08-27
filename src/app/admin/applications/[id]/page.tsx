'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from '@admin/components/AdminShell';

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

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'Declined', classes: 'bg-red-50 text-red-700 border-red-200' },
  active: { label: 'Active', classes: 'bg-green-50 text-green-700 border-green-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-[#f6f2e8] text-[#7b7263] border-[#e4dcc9]' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const [app, setApp] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [updating, setUpdating] = useState(false);
  const [declineNote, setDeclineNote] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load application');
      setApp(data.application);
      setCsrfToken(res.headers.get('x-csrf-token') || '');
      setDeclineNote(data.application?.reviewNote || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  const patch = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/admin/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to update application');
    return data;
  };

  const updateStatus = async (status: string, reviewNote?: string) => {
    setUpdating(true);
    setError('');
    try {
      await patch({ id, status, reviewNote });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update application');
    } finally {
      setUpdating(false);
    }
  };

  const sendCustomEmail = async () => {
    setUpdating(true);
    setError('');
    try {
      await patch({ id, action: 'custom_email', subject: emailSubject, message: emailMessage });
      setEmailOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send email');
    } finally {
      setUpdating(false);
    }
  };

  const name = app?.fields.find((f) => f.key === 'fullName')?.value || 'Application';

  return (
    <AdminShell title="Application detail" description="Review full applicant details and decide">
      <div className="mb-4">
        <Link href="/admin/applications" className="text-sm font-medium text-[#d9711b] hover:underline">
          ← Back to applications
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading || !app ? (
        <div className="rounded-xl border border-[#e4dcc9] bg-white py-16 text-center text-sm text-[#7b7263]">
          {loading ? 'Loading application…' : 'Application not found.'}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-[#e4dcc9] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-editorial text-3xl text-[#0d1a4a]">{name}</h1>
                  <p className="mt-1 text-sm text-[#7b7263]">
                    {app.pathwayLabel}
                    {app.sourceLinkName ? ` · via ${app.sourceLinkName}` : ''}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-[#7b7263]">Submitted</dt>
                  <dd className="mt-1 text-[#0d1a4a]">
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-[#7b7263]">Last updated</dt>
                  <dd className="mt-1 text-[#0d1a4a]">
                    {app.updatedAt ? new Date(app.updatedAt).toLocaleString() : '—'}
                  </dd>
                </div>
                {app.reviewedBy && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-[#7b7263]">Reviewed by</dt>
                    <dd className="mt-1 text-[#0d1a4a]">{app.reviewedBy}</dd>
                  </div>
                )}
                {app.sourceLinkSlug && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-[#7b7263]">Campaign slug</dt>
                    <dd className="mt-1 font-mono text-xs text-[#0d1a4a]">{app.sourceLinkSlug}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
              <div className="border-b border-[#e4dcc9] px-6 py-4">
                <h2 className="font-semibold text-[#0d1a4a]">Applicant details</h2>
              </div>
              <div className="divide-y divide-[#f0eae0] px-6">
                {app.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-sm text-[#7b7263]">{field.label}</span>
                    <span className="text-sm font-medium text-[#0d1a4a] sm:max-w-[60%] sm:text-right">
                      {field.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
              <div className="border-b border-[#e4dcc9] px-6 py-4">
                <h2 className="font-semibold text-[#0d1a4a]">Documents</h2>
              </div>
              {app.documents.length === 0 ? (
                <p className="px-6 py-8 text-sm text-[#7b7263]">No documents attached (legacy application).</p>
              ) : (
                <ul className="divide-y divide-[#f0eae0]">
                  {app.documents.map((doc) => (
                    <li key={doc.key} className="flex items-center justify-between gap-4 px-6 py-4">
                      <span className="text-sm text-[#0d1a4a]">{doc.label}</span>
                      <a
                        href={doc.downloadUrl}
                        className="text-sm font-semibold text-[#d9711b] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download →
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-[#e4dcc9] bg-white p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">Actions</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setEmailOpen(!emailOpen)}
                  className="w-full rounded-lg border border-[#e4dcc9] py-2.5 text-sm font-medium text-[#0d1a4a] hover:border-[#0d1a4a]"
                >
                  Send custom email
                </button>
                {emailOpen && (
                  <div className="space-y-2 rounded-lg border border-[#e4dcc9] bg-[#f9f7f2] p-3">
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full rounded border border-[#e4dcc9] px-2 py-1.5 text-sm"
                    />
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Message"
                      rows={4}
                      className="w-full rounded border border-[#e4dcc9] px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={sendCustomEmail}
                      disabled={updating}
                      className="w-full rounded-lg bg-[#0d1a4a] py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                )}

                {app.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('under_review')}
                    disabled={updating}
                    className="w-full rounded-lg border border-[#e4dcc9] py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    Mark under review
                  </button>
                )}

                {['pending', 'under_review'].includes(app.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Approve this application? The applicant will be emailed automatically.')) {
                        void updateStatus('approved');
                      }
                    }}
                    disabled={updating}
                    className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}

                {!['approved', 'declined'].includes(app.status) && (
                  <div className="space-y-2">
                    <input
                      value={declineNote}
                      onChange={(e) => setDeclineNote(e.target.value)}
                      placeholder="Decline reason (visible to applicant)"
                      className="w-full rounded border border-[#e4dcc9] px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Decline this application? The applicant will be emailed automatically.')) {
                          void updateStatus('declined', declineNote);
                        }
                      }}
                      disabled={updating}
                      className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {app.reviewNote && (
                  <p className="mt-2 rounded-lg bg-[#f9f7f2] p-3 text-xs text-[#7b7263]">
                    <strong className="text-[#0d1a4a]">Note on file:</strong> {app.reviewNote}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/admin/applications')}
              className="w-full text-sm text-[#7b7263] hover:text-[#0d1a4a]"
            >
              Return to list
            </button>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
