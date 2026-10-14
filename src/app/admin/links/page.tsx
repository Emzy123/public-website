'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AdminShell, AdminCard } from '@admin/components/AdminShell';
import { APPLICATION_ROLES, ROLE_LABELS, type ApplicationRole, type RegistrationLink } from '@/lib/types/membership';
import { StatusPill } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatWatDate } from '@/lib/date';

function shareableLinkUrl(link: RegistrationLink): string {
  if (link.url) return link.url;
  if (typeof window !== 'undefined') return `${window.location.origin}/join/${link.slug}`;
  return `/join/${link.slug}`;
}

function getDefaultExpiry(): string {
  const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

const DEFAULT_FORM = {
  name: '',
  roles: ['volunteer', 'community-member'] as ApplicationRole[],
  expiresAt: getDefaultExpiry(),
  quota: '100',
};

export default function RegistrationLinksPage() {
  const [links, setLinks] = useState<RegistrationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<RegistrationLink | null>(null);
  const [detail, setDetail] = useState<{ applications: unknown[]; waitlist: { email: string; capturedAt: string }[] } | null>(null);
  const [qrModalLink, setQrModalLink] = useState<RegistrationLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState(DEFAULT_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registration-links');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load links');
      setLinks(data.links || []);
      setCsrfToken(res.headers.get('x-csrf-token') || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadDetail = async (link: RegistrationLink) => {
    setSelected(link);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/registration-links/${link.slug}`);
      const data = await res.json();
      if (res.ok) setDetail({ applications: data.applications || [], waitlist: data.waitlist || [] });
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (qrModalLink) {
      const url = shareableLinkUrl(qrModalLink);
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#0D1A4A', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [qrModalLink]);

  const copyLink = (link: RegistrationLink) => {
    const url = shareableLinkUrl(link);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedId(link._id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const downloadQrCode = () => {
    if (!qrDataUrl || !qrModalLink) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `sinet-qr-${qrModalLink.slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const createLink = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registration-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({
          name: form.name,
          roles: form.roles,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          quota: form.quota ? Number(form.quota) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create link');
      setShowForm(false);
      setForm(DEFAULT_FORM);
      if (data.link) {
        setSelected(data.link);
        void loadDetail(data.link);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create link');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (link: RegistrationLink, isOpen: boolean) => {
    if (!isOpen) {
      const confirmed = window.confirm(
        `Close admissions for "${link.name}"? Applicants using this campaign link will no longer be able to submit applications.`
      );
      if (!confirmed) return;
    }
    try {
      const res = await fetch('/api/admin/registration-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ id: link._id, isOpen }),
      });
      if (!res.ok) throw new Error('Unable to update link');
      await load();
      if (selected?._id === link._id) {
        const updated = await fetch(`/api/admin/registration-links/${link.slug}`).then((r) => r.json());
        if (updated.link) setSelected(updated.link);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update link');
    }
  };

  const toggleRole = (role: ApplicationRole) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  };

  return (
    <AdminShell
      title="Link Management"
      description="Create campaign registration links — open links also appear as public site spotlights"
    >
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-[#0d1a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2d66]">
          {showForm ? 'Cancel' : '+ Create Link'}
        </button>
      </div>

      {showForm && (
        <AdminCard title="New Registration Link" className="mb-6">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Internal name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lagos Volunteer Drive — Aug 2026" className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
            </label>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase text-[#7b7263]">Role scope</span>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_ROLES.map((role) => (
                  <button key={role} type="button" onClick={() => toggleRole(role)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${form.roles.includes(role) ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#e4dcc9] text-[#7b7263]'}`}>
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Optional expiry</span>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Optional quota</span>
                <input type="number" min={1} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} placeholder="Max applications" className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
              </label>
            </div>
            <button onClick={createLink} disabled={creating || !form.name.trim() || form.roles.length === 0} className="rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] disabled:opacity-50">
              {creating ? 'Creating…' : 'Create & Generate URL'}
            </button>
          </div>
        </AdminCard>
      )}

      <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
          {loading ? (
            <p className="py-16 text-center text-sm text-[#7b7263]">Loading…</p>
          ) : links.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#7b7263]">No registration links yet.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[#e4dcc9] bg-[#f9f7f2]">
                <tr>
                  {['Campaign Name', 'Role Scope', 'Status', 'Applications & Quota', 'Created (WAT)', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae0]">
                {links.map((link) => {
                  const quotaPercent = link.quota
                    ? Math.min(100, Math.round((link.applicationCount / link.quota) * 100))
                    : null;
                  const isCopied = copiedId === link._id;

                  return (
                    <tr
                      key={link._id}
                      onClick={() => loadDetail(link)}
                      className={`cursor-pointer hover:bg-[#f9f7f2] transition ${
                        selected?._id === link._id ? 'bg-[#fdf8ef]' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-[#0d1a4a]">
                        <p>{link.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">/join/{link.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#7b7263]">
                        {link.roles.map((r) => ROLE_LABELS[r]).join(', ')}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={link.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-baseline gap-1 font-semibold text-slate-900">
                          <span>{link.applicationCount}</span>
                          {link.quota && <span className="text-slate-400 text-xs">/ {link.quota}</span>}
                        </div>
                        {quotaPercent !== null && (
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${quotaPercent}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#7b7263] whitespace-nowrap">
                        {formatWatDate(link.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyLink(link)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                            title="Copy shareable link"
                          >
                            {isCopied ? '✓ Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrModalLink(link)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                            title="View QR Code"
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            onClick={() => loadDetail(link)}
                            className="text-xs font-semibold text-[#d9a23c] hover:underline px-1"
                          >
                            Details →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="space-y-4">
            <AdminCard title={selected.name}>
              <div className="mb-3 flex items-center justify-between">
                <StatusPill status={selected.status} />
                <button
                  type="button"
                  onClick={() => setQrModalLink(selected)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <span>📱 View QR Code</span>
                </button>
              </div>

              <p className="mb-1 text-xs font-medium text-[#7b7263]">Shareable Public URL</p>
              <code className="block break-all rounded-xl bg-[#f6f2e8] p-2.5 text-xs font-mono text-slate-800">
                {shareableLinkUrl(selected)}
              </code>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(selected)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  {copiedId === selected._id ? '✓ Copied URL' : '1-Click Copy'}
                </button>
                <Link
                  href={`/join/${selected.slug}`}
                  target="_blank"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Preview Public Page ↗
                </Link>
              </div>

              {/* Quota & Conversion Stats */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium">Admissions Quota:</span>
                  <span className="font-bold text-slate-900">
                    {selected.applicationCount} {selected.quota ? `/ ${selected.quota} seats` : 'applications'}
                  </span>
                </div>
                {selected.quota && (
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((selected.applicationCount / selected.quota) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                )}
                {selected.expiresAt && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Expires on: <span className="font-semibold text-slate-700">{formatWatDate(selected.expiresAt)}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {selected.isOpen ? (
                  <button
                    onClick={() => toggleLink(selected, false)}
                    className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Close Admissions Now
                  </button>
                ) : (
                  <button
                    onClick={() => toggleLink(selected, true)}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Reopen Admissions
                  </button>
                )}
              </div>
            </AdminCard>
            {detail && (
              <>
                <AdminCard title={`Applications (${detail.applications.length})`}>
                  {detail.applications.length === 0 ? (
                    <p className="text-xs text-[#7b7263]">No applications through this link yet.</p>
                  ) : (
                    <Link href={`/admin/applications?linkId=${selected._id}`} className="text-sm font-semibold text-[#d9a23c] hover:underline">View in Applications →</Link>
                  )}
                </AdminCard>
                <AdminCard title={`Waitlist (${detail.waitlist.length})`}>
                  {detail.waitlist.length === 0 ? (
                    <p className="text-xs text-[#7b7263]">No waitlist emails yet.</p>
                  ) : (
                    <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                      {detail.waitlist.map((entry, i) => (
                        <li key={i} className="flex justify-between border-b border-[#f0eae0] py-1">
                          <span>{entry.email}</span>
                          <span className="text-[#7b7263]">{formatWatDate(entry.capturedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminCard>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Code Sharing Modal */}
      <Modal
        isOpen={Boolean(qrModalLink)}
        onClose={() => setQrModalLink(null)}
        title={qrModalLink ? `Campaign QR: ${qrModalLink.name}` : 'QR Code'}
      >
        {qrModalLink && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-slate-500 mb-4">
              Scan with any mobile camera to open the public admission form directly on a smartphone.
            </p>

            {qrDataUrl ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${qrModalLink.name}`}
                  className="h-56 w-56 rounded-xl"
                />
              </div>
            ) : (
              <div className="h-56 w-56 flex items-center justify-center text-slate-400 text-xs">
                Generating QR code…
              </div>
            )}

            <div className="mt-4 w-full">
              <code className="block break-all rounded-xl bg-slate-50 p-2.5 text-xs font-mono text-slate-700 border border-slate-200">
                {shareableLinkUrl(qrModalLink)}
              </code>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => copyLink(qrModalLink)}
                className="rounded-xl bg-[#0d1a4a] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d66] transition"
              >
                {copiedId === qrModalLink._id ? '✓ Copied to Clipboard' : 'Copy Public URL'}
              </button>
              <button
                type="button"
                onClick={downloadQrCode}
                disabled={!qrDataUrl}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
              >
                📥 Download PNG
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
