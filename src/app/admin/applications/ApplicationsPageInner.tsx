'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminShell } from '@admin/components/AdminShell';
import { ROLE_LABELS, type ApplicationRole } from '@/lib/types/membership';
import type { RegistrationLink } from '@/lib/types/membership';

type Application = {
  _id: string;
  pathway: string;
  pathwayLabel?: string;
  status: string;
  submittedAt?: string;
  reviewNote?: string;
  sourceLinkName?: string;
  sourceLinkSlug?: string;
  data: Record<string, unknown>;
};

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

function pathwayDisplay(app: Application): string {
  if (app.pathwayLabel) return app.pathwayLabel;
  if (app.pathway in ROLE_LABELS) return ROLE_LABELS[app.pathway as ApplicationRole];
  return app.pathway.replace(/-/g, ' ');
}

function detailsDisplay(app: Application): string {
  const d = app.data;
  if (app.pathway === 'investment') {
    return `${String(d.tier || '—')} · ₦${Number(d.amount || 0).toLocaleString()}`;
  }
  if (app.pathway === 'partnership-interest' || d.role === 'partnership-interest') {
    return String(d.organization || d.interestDescription || '—').slice(0, 60);
  }
  return `${String(d.role || app.pathway || '—')} · ${String(d.location || '—')}`;
}

export default function ApplicationsPageInner() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [links, setLinks] = useState<RegistrationLink[]>([]);
  const [pathwayFilter, setPathwayFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState(searchParams.get('linkId') || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (pathwayFilter !== 'all') params.set('pathway', pathwayFilter);
      if (linkFilter !== 'all') params.set('linkId', linkFilter);
      const qs = params.toString();
      const response = await fetch(`/api/admin/applications${qs ? `?${qs}` : ''}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load applications');
      setApplications(data.applications || []);
      setLinks(data.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, [pathwayFilter, linkFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = applications.filter((a) => a.status === 'pending').length;

  return (
    <AdminShell title="Applications" description="Review campaign-link applications">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4dcc9] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#7b7263]">Total</p>
          <p className="mt-2 text-3xl font-semibold text-[#0d1a4a]">{applications.length}</p>
        </div>
        <div className="rounded-xl border border-[#e4dcc9] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#7b7263]">Pending Review</p>
          <p className={`mt-2 text-3xl font-semibold ${pending > 0 ? 'text-[#d9711b]' : 'text-[#0d1a4a]'}`}>{pending}</p>
        </div>
        <div className="rounded-xl border border-[#e4dcc9] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#7b7263]">Active Links</p>
          <p className="mt-2 text-3xl font-semibold text-[#0d1a4a]">{links.filter((l) => l.status === 'open').length}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value)}
          className="rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All links</option>
          {links.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={pathwayFilter}
          onChange={(e) => setPathwayFilter(e.target.value)}
          className="rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="investment">Investment (legacy)</option>
          <option value="get-involved">Get Involved (legacy)</option>
        </select>
      </div>

      <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#7b7263]">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#7b7263]">No applications match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[#e4dcc9] bg-[#f9f7f2]">
                <tr>
                  {['Applicant', 'Role', 'Source Link', 'Details', 'Submitted', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae0]">
                {applications.map((app) => {
                  const d = app.data;
                  return (
                    <tr key={app._id} className="hover:bg-[#f9f7f2]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0d1a4a]">{String(d.fullName || '—')}</p>
                        <p className="text-xs text-[#7b7263]">{maskEmail(String(d.email || ''))}</p>
                      </td>
                      <td className="px-5 py-4 capitalize text-[#0d1a4a]">{pathwayDisplay(app)}</td>
                      <td className="px-5 py-4 text-xs text-[#7b7263]">{app.sourceLinkName || '—'}</td>
                      <td className="px-5 py-4 text-[#7b7263]">{detailsDisplay(app)}</td>
                      <td className="px-5 py-4 text-xs text-[#7b7263]">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/applications/${app._id}`}
                          className="text-xs font-semibold text-[#d9711b] hover:underline"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
