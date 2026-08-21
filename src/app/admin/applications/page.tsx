'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@admin/components/AdminShell';

type Application = {
  _id: string;
  pathway: 'investment' | 'get-involved';
  status: string;
  submittedAt?: string;
  reviewNote?: string;
  data: Record<string, unknown>;
};
type Filter = 'all' | 'investment' | 'get-involved';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'Declined', classes: 'bg-red-50 text-red-700 border-red-200' },
  active: { label: 'Active', classes: 'bg-green-50 text-green-700 border-green-200' },
};

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}${'*'.repeat(Math.min(local.length - 2, 6))}@${domain}`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-[#f6f2e8] text-[#7b7263] border-[#e4dcc9]' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter === 'all' ? '' : `?pathway=${filter}`;
      const response = await fetch(`/api/admin/applications${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load applications');
      setApplications(data.applications || []);
      setCsrfToken(response.headers.get('x-csrf-token') || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    setError('');
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update application');
      setApplications((curr) =>
        curr.map((a) => (a._id === id ? { ...a, status } : a))
      );
      if (selected?._id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update application');
    } finally {
      setUpdating(null);
    }
  };

  const counts = {
    all: applications.length,
    investment: applications.filter((a) => a.pathway === 'investment').length,
    involved: applications.filter((a) => a.pathway === 'get-involved').length,
    pending: applications.filter((a) => a.status === 'pending').length,
  };

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'investment', label: 'Investment', count: counts.investment },
    { value: 'get-involved', label: 'Get Involved', count: counts.involved },
  ];

  return (
    <AdminShell
      title="Applications"
      description="Review Start Investing and Get Involved applications"
    >
      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Investment', value: counts.investment },
          { label: 'Get Involved', value: counts.involved },
          { label: 'Pending Review', value: counts.pending, highlight: counts.pending > 0 },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl border border-[#e4dcc9] bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[#7b7263]">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${highlight ? 'text-[#d9711b]' : 'text-[#0d1a4a]'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-[#e4dcc9] bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-[#0d1a4a] text-white shadow-sm'
                : 'text-[#7b7263] hover:text-[#0d1a4a]'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs ${
                filter === tab.value ? 'text-white/70' : 'text-[#b0a799]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table + detail panel */}
      <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
        <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#7b7263]">
              Loading applications…
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-[#0d1a4a]">No applications</p>
              <p className="mt-1 text-xs text-[#7b7263]">None match this filter yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-[#e4dcc9] bg-[#f9f7f2]">
                  <tr>
                    {['Applicant', 'Pathway', 'Details', 'Submitted', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eae0]">
                  {applications.map((app) => {
                    const d = app.data;
                    const details =
                      app.pathway === 'investment'
                        ? `${String(d.tier || '—')} · ${String(d.plan || '—')} · ₦${Number(d.amount || 0).toLocaleString()}`
                        : `${String(d.role || '—')} · ${String(d.location || '—')}`;
                    const isSelected = selected?._id === app._id;
                    return (
                      <tr
                        key={app._id}
                        onClick={() => setSelected(isSelected ? null : app)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#fdf8ef]' : 'hover:bg-[#f9f7f2]'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#0d1a4a]">{String(d.fullName || '—')}</p>
                          <p className="text-xs text-[#7b7263]">{maskEmail(String(d.email || ''))}</p>
                        </td>
                        <td className="px-5 py-4 capitalize text-[#0d1a4a]">
                          {app.pathway.replace('-', ' ')}
                        </td>
                        <td className="px-5 py-4 text-[#7b7263]">{details}</td>
                        <td className="px-5 py-4 text-xs text-[#7b7263]">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs text-[#d9a23c]">{isSelected ? '✕ Close' : 'Review →'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
            <div className="border-b border-[#e4dcc9] px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-[#0d1a4a]">
                    {String(selected.data.fullName || '—')}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#7b7263]">
                    {selected.submittedAt
                      ? new Date(selected.submittedAt).toLocaleString()
                      : 'Date unknown'}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">
                Application Details
              </p>
              <div className="space-y-2">
                {Object.entries(selected.data).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-[#f0eae0] py-2 text-sm">
                    <span className="capitalize text-[#7b7263]">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-right font-medium text-[#0d1a4a]">
                      {key === 'amount' ? `₦${Number(val).toLocaleString()}` : String(val ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!['approved', 'declined'].includes(selected.status) && (
              <div className="border-t border-[#e4dcc9] px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">
                  Actions
                </p>
                <div className="flex flex-col gap-2">
                  {selected.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(selected._id, 'under_review')}
                      disabled={updating === selected._id}
                      className="w-full rounded-lg border border-[#e4dcc9] py-2.5 text-sm font-medium text-[#0d1a4a] transition-colors hover:border-[#0d1a4a] disabled:opacity-50"
                    >
                      Mark Under Review
                    </button>
                  )}
                  {['pending', 'under_review'].includes(selected.status) && (
                    <button
                      onClick={() => {
                        if (window.confirm('Approve this application? This will create a membership record.')) {
                          updateStatus(selected._id, 'approved');
                        }
                      }}
                      disabled={updating === selected._id}
                      className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve Application
                    </button>
                  )}
                  {!['approved', 'declined'].includes(selected.status) && (
                    <button
                      onClick={() => {
                        if (window.confirm('Decline this application? The applicant will be notified.')) {
                          updateStatus(selected._id, 'declined');
                        }
                      }}
                      disabled={updating === selected._id}
                      className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Decline Application
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
